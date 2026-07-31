import * as Crypto from 'expo-crypto';

export function createId(): string {
  return Crypto.randomUUID();
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatEta(bytesRemaining: number, bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return 'Calculating…';
  const seconds = Math.ceil(bytesRemaining / bytesPerSecond);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '—/s';
  return `${formatBytes(bytesPerSecond)}/s`;
}
