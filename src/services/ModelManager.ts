import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import type { InstalledModel } from '../types/models';
import type { ModelListing } from '../types/models';
import { downloadManager } from './DownloadManager';
import { getListingById } from '../data/catalog';

const STORAGE_KEY = '@pocketbrain/installed_models';

export class ModelManager {
  private installed = new Map<string, InstalledModel>();
  private listeners = new Set<(models: InstalledModel[]) => void>();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.hydrate();
  }

  private async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as InstalledModel[];
      for (const item of list) {
        this.installed.set(item.listingId, item);
      }
      this.emit();
    } catch {
      // ignore corrupt storage
    }
  }

  private async persist() {
    const list = this.list();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  private emit() {
    const snapshot = this.list();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  subscribe(listener: (models: InstalledModel[]) => void): () => void {
    this.listeners.add(listener);
    void this.ready.then(() => listener(this.list()));
    return () => this.listeners.delete(listener);
  }

  async whenReady() {
    await this.ready;
  }

  list(): InstalledModel[] {
    return Array.from(this.installed.values()).sort(
      (a, b) => (b.lastUsedAt ?? b.installedAt) - (a.lastUsedAt ?? a.installedAt),
    );
  }

  get(listingId: string): InstalledModel | undefined {
    return this.installed.get(listingId);
  }

  isInstalled(listingId: string): boolean {
    return this.installed.get(listingId)?.status === 'installed';
  }

  totalStorageBytes(): number {
    return this.list().reduce((sum, m) => sum + (m.sizeBytes || 0), 0);
  }

  async markDownloading(listingId: string, localName: string) {
    await this.ready;
    const existing = this.installed.get(listingId);
    this.installed.set(listingId, {
      listingId,
      localName,
      filePath: existing?.filePath ?? '',
      installedAt: existing?.installedAt ?? Date.now(),
      lastUsedAt: existing?.lastUsedAt,
      sizeBytes: existing?.sizeBytes ?? 0,
      status: 'downloading',
    });
    await this.persist();
    this.emit();
  }

  async markInstalled(listing: ModelListing, filePath: string, sizeBytes: number) {
    await this.ready;
    this.installed.set(listing.id, {
      listingId: listing.id,
      localName: listing.name,
      filePath,
      installedAt: Date.now(),
      sizeBytes,
      status: 'installed',
      sha256Verified: Boolean(listing.sha256),
    });
    await this.persist();
    this.emit();
  }

  async rename(listingId: string, localName: string) {
    await this.ready;
    const model = this.installed.get(listingId);
    if (!model) return;
    this.installed.set(listingId, { ...model, localName });
    await this.persist();
    this.emit();
  }

  async touch(listingId: string) {
    await this.ready;
    const model = this.installed.get(listingId);
    if (!model) return;
    this.installed.set(listingId, {
      ...model,
      lastUsedAt: Date.now(),
      usageCount: (model.usageCount ?? 0) + 1,
    });
    await this.persist();
    this.emit();
  }

  async setFavorite(listingId: string, favorite: boolean) {
    await this.ready;
    const model = this.installed.get(listingId);
    if (!model) return;
    this.installed.set(listingId, { ...model, favorite });
    await this.persist();
    this.emit();
  }

  async delete(listingId: string) {
    await this.ready;
    const model = this.installed.get(listingId);
    if (!model) return;
    if (model.filePath) {
      try {
        const file = new File(model.filePath);
        if (file.exists) file.delete();
      } catch {
        // file may already be gone
      }
    }
    this.installed.delete(listingId);
    await this.persist();
    this.emit();
  }

  async downloadAndInstall(
    listing: ModelListing,
    wifiOnly: boolean,
    onJobId?: (jobId: string) => void,
  ): Promise<string> {
    await this.markDownloading(listing.id, listing.name);
    const fileName = listing.downloadUrl.split('/').pop() ?? `${listing.id}.gguf`;

    const job = await downloadManager.enqueue({
      modelId: listing.id,
      modelName: listing.name,
      url: listing.downloadUrl,
      fileName,
      expectedSha256: listing.sha256,
      wifiOnly,
      totalBytes: listing.downloadSizeBytes,
    });
    onJobId?.(job.id);

    return new Promise((resolve, reject) => {
      const unsubscribe = downloadManager.subscribe(async (updated) => {
        if (updated.id !== job.id) return;
        if (updated.state === 'completed') {
          unsubscribe();
          await this.markInstalled(listing, updated.destinationPath, updated.bytesWritten);
          resolve(updated.destinationPath);
        } else if (updated.state === 'error' || updated.state === 'cancelled') {
          unsubscribe();
          await this.ready;
          this.installed.delete(listing.id);
          await this.persist();
          this.emit();
          reject(new Error(updated.error ?? updated.state));
        } else if (updated.state === 'paused') {
          await this.ready;
          const current = this.installed.get(listing.id);
          if (current) {
            this.installed.set(listing.id, { ...current, status: 'paused' });
            await this.persist();
            this.emit();
          }
        }
      });
    });
  }

  /** Re-download and replace an installed model with rollback if the update fails. */
  async updateOrReinstall(listing: ModelListing, wifiOnly: boolean): Promise<string> {
    await this.ready;
    const existing = this.installed.get(listing.id);
    let backupPath: string | null = null;

    if (existing?.filePath) {
      try {
        const current = new File(existing.filePath);
        if (current.exists) {
          backupPath = `${existing.filePath}.bak`;
          const backup = new File(backupPath);
          if (backup.exists) backup.delete();
          backup.create({ intermediates: true, overwrite: true });
          const bytes = await current.bytes();
          backup.write(bytes);
          current.delete();
        }
      } catch {
        backupPath = null;
      }
    }

    try {
      const path = await this.downloadAndInstall(listing, wifiOnly);
      if (backupPath) {
        try {
          const backup = new File(backupPath);
          if (backup.exists) backup.delete();
        } catch {
          // ignore leftover backup
        }
      }
      return path;
    } catch (error) {
      if (backupPath && existing) {
        try {
          const backup = new File(backupPath);
          const restored = new File(existing.filePath);
          if (backup.exists) {
            restored.create({ intermediates: true, overwrite: true });
            const bytes = await backup.bytes();
            restored.write(bytes);
            backup.delete();
            await this.markInstalled(listing, existing.filePath, existing.sizeBytes);
          }
        } catch {
          // rollback best-effort
        }
      }
      throw error;
    }
  }

  /** Models not used recently — candidates for cleanup. */
  unusedModels(olderThanMs = 14 * 24 * 60 * 60 * 1000): InstalledModel[] {
    const cutoff = Date.now() - olderThanMs;
    return this.list().filter((m) => {
      if (m.status !== 'installed') return false;
      if (m.favorite) return false;
      const last = m.lastUsedAt ?? m.installedAt;
      return last < cutoff || (m.usageCount ?? 0) === 0;
    });
  }

  /**
   * Optional update prompts.
   * Installed models do not yet persist catalog `version`, so we cannot honestly detect updates.
   * Returns [] until install metadata stores a comparable version (avoids listing every model).
   */
  listAvailableUpdates(): Array<{ listingId: string; localName: string; catalogVersion?: string }> {
    return [];
  }
}

export const modelManager = new ModelManager();
