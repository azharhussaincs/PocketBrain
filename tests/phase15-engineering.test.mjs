import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Mirror of src/utils/errors.ts sanitizeFileName — keep in sync when changing production helper. */
function sanitizeFileName(name, fallback = 'model.bin') {
  const base = name.split(/[/\\]/).pop()?.trim() || fallback;
  const cleaned = base.replace(/[^\w.\-()+ ]+/g, '_').replace(/^\.+/, '');
  return cleaned.slice(0, 180) || fallback;
}

function formatNetworkDownloadError(error) {
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
  if (/HTTP\s*401|Unauthorized|Invalid username or password/i.test(raw)) {
    return 'Download was blocked by the model host (HTTP 401). The catalog link may need a public mirror — update the app or try another model, then retry.';
  }
  if (/HTTP\s*403|Forbidden/i.test(raw)) {
    return 'Download was forbidden by the model host (HTTP 403). Try another model or retry later.';
  }
  if (/HTTP\s*404|Not Found/i.test(raw)) {
    return 'Model file was not found on the host (HTTP 404). Try another model from Marketplace.';
  }
  return raw || 'Download failed. Check storage space and network, then retry.';
}

function formatUserFacingError(error, fallback = 'Something went wrong') {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

test('sanitizeFileName strips path traversal and unsafe characters', () => {
  assert.equal(sanitizeFileName('../../etc/passwd'), 'passwd');
  assert.equal(sanitizeFileName('a/b\\c.gguf'), 'c.gguf');
  assert.equal(sanitizeFileName('model<script>.bin'), 'model_script_.bin');
  assert.equal(sanitizeFileName('...'), 'model.bin');
  assert.equal(sanitizeFileName(''), 'model.bin');
});

test('formatNetworkDownloadError maps network and integrity failures', () => {
  assert.match(formatNetworkDownloadError(new Error('No network connection')), /No network/);
  assert.match(formatNetworkDownloadError(new Error('Wi-Fi only downloads')), /Wi/);
  assert.match(formatNetworkDownloadError(new Error('SHA256 mismatch')), /incomplete file was removed/);
  assert.equal(formatNetworkDownloadError(new Error('cancelled by user')), 'Download cancelled.');
  assert.match(formatNetworkDownloadError(new Error('Unable to download a file: HTTP 401')), /HTTP 401/);
});

test('formatUserFacingError prefers Error.message', () => {
  assert.equal(formatUserFacingError(new Error('Low storage')), 'Low storage');
  assert.equal(formatUserFacingError('  plain  '), 'plain');
  assert.equal(formatUserFacingError(null, 'fallback'), 'fallback');
});

test('shared resolveModelId helper exists once (no duplicate local resolvers)', () => {
  const shared = path.join(root, 'src/workspace/utils/resolveModelId.ts');
  assert.ok(fs.existsSync(shared), 'resolveModelId.ts missing');
  for (const rel of [
    'src/workspace/generators/DocumentGenerator.ts',
    'src/workspace/generators/PresentationGenerator.ts',
    'src/workspace/generators/SpreadsheetGenerator.ts',
    'src/workspace/services/AIEditService.ts',
  ]) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    assert.match(src, /resolveInstalledOrStarterModelId/, `${rel} should use shared helper`);
    assert.doesNotMatch(src, /function resolveModelId/, `${rel} should not redefine resolveModelId`);
  }
});

test('Phase 15 engineering reports exist', () => {
  for (const name of [
    'ENGINEERING_REVIEW.md',
    'PERFORMANCE_REVIEW.md',
    'SECURITY_REVIEW.md',
    'DEPENDENCY_AUDIT.md',
    'TEST_REVIEW.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, 'release', name)), `${name} missing`);
  }
});

test('dead ModelCard component removed', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/components/ModelCard.tsx')), false);
});
