/**
 * Shared error messaging helpers for production-quality failure paths.
 */

/** Basename-only, filesystem-safe model/download filenames. */
export function sanitizeFileName(name: string, fallback = 'model.bin'): string {
  const base = name.split(/[/\\]/).pop()?.trim() || fallback;
  const cleaned = base.replace(/[^\w.\-()+ ]+/g, '_').replace(/^\.+/, '');
  return cleaned.slice(0, 180) || fallback;
}

export function formatNetworkDownloadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/no network/i.test(raw)) {
    return 'No network connection. Connect to the internet (or turn off Offline mode) and retry.';
  }
  if (/wi-?fi only/i.test(raw)) {
    return 'Wi‑Fi only downloads are enabled. Connect to Wi‑Fi or disable Wi‑Fi only in Settings → Privacy, then retry.';
  }
  if (/SHA256|checksum|integrity/i.test(raw)) {
    return `${raw} The incomplete file was removed. Retry the download on a reliable network.`;
  }
  if (/cancelled/i.test(raw)) {
    return 'Download cancelled.';
  }
  return raw || 'Download failed. Check storage space and network, then retry.';
}

export function formatUserFacingError(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}
