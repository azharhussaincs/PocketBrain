import {
  Directory,
  DownloadTask,
  File,
  Paths,
  type DownloadPauseState,
} from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DownloadJob } from '../types/models';
import { createId } from '../utils/format';
import { formatNetworkDownloadError, sanitizeFileName } from '../utils/errors';

type ProgressListener = (job: DownloadJob) => void;

const MODELS_DIR_NAME = 'models';
const QUEUE_KEY = '@pocketbrain/download_queue_v1';
const MAX_CONCURRENT = 2;

/** Browser-like UA helps some CDNs; avoid empty/malformed Authorization that HF rejects. */
const DOWNLOAD_HEADERS: Record<string, string> = {
  'User-Agent': 'PocketBrain/1.0.0 (Android; expo-file-system)',
  Accept: '*/*',
};

export function getModelsDirectory(): Directory {
  const dir = new Directory(Paths.document, MODELS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export function getModelFile(modelId: string, fileName: string): File {
  const safeId = sanitizeFileName(modelId, 'model');
  const safeName = sanitizeFileName(fileName, 'weights.bin');
  return new File(getModelsDirectory(), `${safeId}-${safeName}`);
}

async function assertNetworkAllowed(wifiOnly: boolean): Promise<void> {
  const state = await Network.getNetworkStateAsync();
  if (!state.isConnected) {
    throw new Error(
      'No network connection. Connect to the internet (or turn off Offline mode) and retry.',
    );
  }
  if (wifiOnly && state.type !== Network.NetworkStateType.WIFI) {
    throw new Error(
      'Wi‑Fi only downloads are enabled. Connect to Wi‑Fi, or turn off “Wi‑Fi only downloads” in Settings, then retry. Mobile data works when that switch is off.',
    );
  }
}

export class DownloadManager {
  private jobs = new Map<string, DownloadJob>();
  private tasks = new Map<string, DownloadTask>();
  private listeners = new Set<ProgressListener>();
  private speeds = new Map<string, { at: number; bytes: number; bps: number }>();
  private hydrated = false;

  async hydrate(): Promise<void> {
    if (this.hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as DownloadJob[];
        for (const job of list) {
          const state =
            job.state === 'active' || job.state === 'queued' || job.state === 'verifying'
              ? 'paused'
              : job.state;
          this.jobs.set(job.id, { ...job, state });
        }
      }
    } catch {
      // Corrupt queue — reset so the app remains usable.
      this.jobs.clear();
      try {
        await AsyncStorage.removeItem(QUEUE_KEY);
      } catch {
        // ignore
      }
    }
    this.hydrated = true;
    this.emitAll();
  }

  private async persistQueue() {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.getJobs()));
  }

  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getJobs(): DownloadJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getJob(id: string): DownloadJob | undefined {
    return this.jobs.get(id);
  }

  getBytesPerSecond(jobId: string): number {
    return this.speeds.get(jobId)?.bps ?? 0;
  }

  activeCount(): number {
    return this.getJobs().filter((j) => j.state === 'active').length;
  }

  private emit(job: DownloadJob) {
    this.jobs.set(job.id, { ...job });
    for (const listener of this.listeners) {
      listener(this.jobs.get(job.id)!);
    }
    void this.persistQueue();
  }

  private emitAll() {
    for (const job of this.jobs.values()) {
      for (const listener of this.listeners) listener(job);
    }
  }

  private updateJob(id: string, patch: Partial<DownloadJob>) {
    const current = this.jobs.get(id);
    if (!current) return;
    this.emit({ ...current, ...patch, updatedAt: Date.now() });
  }

  private attachProgress(jobId: string, totalHint: number) {
    return ({ bytesWritten, totalBytes }: { bytesWritten: number; totalBytes: number }) => {
      const now = Date.now();
      const prev = this.speeds.get(jobId);
      let bps = prev?.bps ?? 0;
      if (prev && now > prev.at) {
        bps = ((bytesWritten - prev.bytes) / (now - prev.at)) * 1000;
      }
      this.speeds.set(jobId, { at: now, bytes: bytesWritten, bps });
      this.updateJob(jobId, {
        state: 'active',
        bytesWritten,
        totalBytes: totalBytes || totalHint,
      });
    };
  }

  private async pumpQueue() {
    while (this.activeCount() < MAX_CONCURRENT) {
      const next = this.getJobs().find((j) => j.state === 'queued');
      if (!next) break;
      this.updateJob(next.id, { state: 'active' });
      const destination = new File(next.destinationPath);
      const task = File.createDownloadTask(next.url, destination, {
        headers: DOWNLOAD_HEADERS,
        onProgress: this.attachProgress(next.id, next.totalBytes),
      });
      this.tasks.set(next.id, task);
      void this.finishDownload(next.id, task);
    }
  }

  async enqueue(options: {
    modelId: string;
    modelName: string;
    url: string;
    fileName: string;
    expectedSha256?: string;
    wifiOnly: boolean;
    totalBytes?: number;
  }): Promise<DownloadJob> {
    await this.hydrate();
    await assertNetworkAllowed(options.wifiOnly);

    const needed = options.totalBytes ?? 0;
    if (needed > 0) {
      try {
        const free = Paths.availableDiskSpace;
        if (typeof free === 'number' && free < needed + 32_000_000) {
          throw new Error(
            `Not enough free storage. This download needs about ${Math.ceil(needed / 1_000_000)} MB plus spare space. Free storage and retry.`,
          );
        }
      } catch (error) {
        if (error instanceof Error && /Not enough free storage/i.test(error.message)) {
          throw error;
        }
        // Disk probe unavailable — continue; UI still gates via HardwareService.
      }
    }

    const destination = getModelFile(options.modelId, options.fileName);
    if (destination.exists) {
      destination.delete();
    }

    const job: DownloadJob = {
      id: createId(),
      modelId: options.modelId,
      modelName: options.modelName,
      url: options.url,
      destinationPath: destination.uri,
      state: 'queued',
      bytesWritten: 0,
      totalBytes: options.totalBytes ?? 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      expectedSha256: options.expectedSha256,
      wifiOnly: options.wifiOnly,
    };
    this.emit(job);
    await this.pumpQueue();
    return this.jobs.get(job.id)!;
  }

  private async finishDownload(jobId: string, task: DownloadTask) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      const file = await task.downloadAsync();
      if (!file) {
        this.updateJob(jobId, {
          state: 'paused',
          pauseState: task.savable() as DownloadPauseState,
        });
        return;
      }
      await this.completeWithOptionalVerify(jobId, file);
    } catch (error) {
      const current = this.jobs.get(jobId);
      if (current?.state === 'cancelled' || current?.state === 'paused') return;
      this.deletePartialFile(current?.destinationPath);
      this.updateJob(jobId, {
        state: 'error',
        error: formatNetworkDownloadError(error),
      });
    } finally {
      try {
        task.release();
      } catch {
        // ignore
      }
      this.tasks.delete(jobId);
      await this.pumpQueue();
    }
  }

  private async completeWithOptionalVerify(jobId: string, file: File) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    // Cancel may race with download completion — never mark cancelled jobs completed.
    if (job.state === 'cancelled') {
      try {
        if (file.exists) file.delete();
      } catch {
        // ignore
      }
      return;
    }

    if (job.expectedSha256) {
      this.updateJob(jobId, { state: 'verifying' });
      const latest = this.jobs.get(jobId);
      if (!latest || latest.state === 'cancelled') {
        try {
          if (file.exists) file.delete();
        } catch {
          // ignore
        }
        return;
      }
      const ok = await verifyFileSha256(file, job.expectedSha256);
      if (!ok) {
        file.delete();
        this.updateJob(jobId, {
          state: 'error',
          error:
            'Integrity check failed (SHA-256 mismatch). The incomplete file was removed. Retry on a reliable network.',
        });
        return;
      }
    }

    const afterVerify = this.jobs.get(jobId);
    if (!afterVerify || afterVerify.state === 'cancelled') {
      try {
        if (file.exists) file.delete();
      } catch {
        // ignore
      }
      return;
    }

    this.updateJob(jobId, {
      state: 'completed',
      bytesWritten: file.size,
      totalBytes: file.size || job.totalBytes,
      destinationPath: file.uri,
    });
  }

  async pause(jobId: string): Promise<void> {
    const task = this.tasks.get(jobId);
    if (!task) {
      this.updateJob(jobId, { state: 'paused' });
      return;
    }
    await task.pauseAsync();
    this.updateJob(jobId, {
      state: 'paused',
      pauseState: task.savable(),
    });
  }

  async resume(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.state !== 'paused') return;
    await assertNetworkAllowed(job.wifiOnly);

    if (this.activeCount() >= MAX_CONCURRENT) {
      this.updateJob(jobId, { state: 'queued' });
      return;
    }

    const pauseState = job.pauseState as DownloadPauseState | undefined;
    const task = pauseState
      ? DownloadTask.fromSavable(pauseState, {
          headers: DOWNLOAD_HEADERS,
          onProgress: this.attachProgress(jobId, job.totalBytes),
        })
      : File.createDownloadTask(job.url, new File(job.destinationPath), {
          headers: DOWNLOAD_HEADERS,
          onProgress: this.attachProgress(jobId, job.totalBytes),
        });

    this.tasks.set(jobId, task);
    this.updateJob(jobId, { state: 'active' });

    try {
      const file = pauseState ? await task.resumeAsync() : await task.downloadAsync();
      if (!file) {
        this.updateJob(jobId, { state: 'paused', pauseState: task.savable() });
        return;
      }
      await this.completeWithOptionalVerify(jobId, file);
    } catch (error) {
      const current = this.jobs.get(jobId);
      if (current?.state === 'cancelled' || current?.state === 'paused') return;
      this.deletePartialFile(current?.destinationPath);
      this.updateJob(jobId, {
        state: 'error',
        error: formatNetworkDownloadError(error),
      });
    } finally {
      try {
        task.release();
      } catch {
        // ignore
      }
      this.tasks.delete(jobId);
      await this.pumpQueue();
    }
  }

  cancel(jobId: string): void {
    const job = this.jobs.get(jobId);
    const task = this.tasks.get(jobId);
    task?.cancel();
    // Incomplete weights are not usable — remove so retry starts clean.
    this.deletePartialFile(job?.destinationPath);
    this.updateJob(jobId, { state: 'cancelled', pauseState: undefined });
    this.tasks.delete(jobId);
    void this.pumpQueue();
  }

  /** Best-effort removal of an incomplete download destination. */
  private deletePartialFile(destinationPath?: string): void {
    if (!destinationPath) return;
    try {
      const file = new File(destinationPath);
      if (file.exists) file.delete();
    } catch {
      // ignore
    }
  }

  async retry(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const fileName = job.destinationPath.split('/').pop() ?? `${job.modelId}.gguf`;
    const prefix = `${sanitizeFileName(job.modelId, 'model')}-`;
    this.cancel(jobId);
    await this.enqueue({
      modelId: job.modelId,
      modelName: job.modelName,
      url: job.url,
      fileName: fileName.startsWith(prefix) ? fileName.slice(prefix.length) : fileName,
      expectedSha256: job.expectedSha256,
      wifiOnly: job.wifiOnly,
      totalBytes: job.totalBytes,
    });
  }
}

async function verifyFileSha256(file: File, expected: string): Promise<boolean> {
  const bytes = await file.bytes();
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === expected.toLowerCase();
}

export const downloadManager = new DownloadManager();
