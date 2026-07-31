import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { downloadManager } from '../services/DownloadManager';
import { formatBytes, formatEta, formatSpeed } from '../utils/format';
import type { DownloadJob } from '../types/models';

export type DownloadUiProgress = {
  job: DownloadJob;
  /** 0–1 when total known, otherwise 0 */
  ratio: number;
  percent: number | null;
  label: string;
  detail: string;
};

/** Live download progress for a catalog model id (Get / gates / Home). */
export function useModelDownloadProgress(modelId: string | undefined): DownloadUiProgress | null {
  const downloads = useAppStore((s) => s.downloads);

  return useMemo(() => {
    if (!modelId) return null;
    const job = downloads.find(
      (d) =>
        d.modelId === modelId &&
        (d.state === 'active' ||
          d.state === 'queued' ||
          d.state === 'verifying' ||
          d.state === 'paused'),
    );
    if (!job) return null;

    const ratio =
      job.totalBytes > 0 ? Math.min(Math.max(job.bytesWritten / job.totalBytes, 0), 1) : 0;
    const percent =
      job.totalBytes > 0 ? Math.min(100, Math.round((job.bytesWritten / job.totalBytes) * 100)) : null;
    const bps = downloadManager.getBytesPerSecond(job.id);
    const remaining = Math.max(job.totalBytes - job.bytesWritten, 0);

    let label = 'Downloading…';
    if (job.state === 'queued') label = 'Waiting in queue…';
    else if (job.state === 'paused') label = 'Paused';
    else if (job.state === 'verifying') label = 'Checking file…';
    else if (percent != null) label = `Downloading ${percent}%`;

    const detail =
      job.state === 'verifying'
        ? 'Verifying integrity'
        : job.totalBytes > 0
          ? `${formatBytes(job.bytesWritten)} / ${formatBytes(job.totalBytes)} · ${formatSpeed(bps)} · ${formatEta(remaining, bps)}`
          : `${formatBytes(job.bytesWritten)} downloaded`;

    return { job, ratio, percent, label, detail };
  }, [downloads, modelId]);
}
