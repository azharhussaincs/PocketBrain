import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 17 release engineer pack exists', () => {
  for (const rel of [
    'release/RELEASE_ENGINEER_REPORT.md',
    'release/REPOSITORY_HEALTH_REPORT.md',
    'release/MODEL_INTEGRITY_REPORT.md',
    'release/DOCUMENTATION_CONSISTENCY_REPORT.md',
    'release/FINAL_RELEASE_HANDOFF.md',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test('Phase 17 certification is Ready for External Validation', () => {
  const handoff = fs.readFileSync(path.join(root, 'release/FINAL_RELEASE_HANDOFF.md'), 'utf8');
  assert.match(handoff, /Repository Ready for External Validation/);
  assert.match(handoff, /Repository Ready for Production \| \*\*No\*\*/);
});

test('VisionService documents limited pixel path', () => {
  const src = fs.readFileSync(path.join(root, 'src/ai/vision/VisionService.ts'), 'utf8');
  assert.match(src, /VISION_LIMITATION_NOTICE/);
  assert.match(src, /does not pass image pixels/i);
});

test('DownloadManager cleans partial files on cancel', () => {
  const src = fs.readFileSync(path.join(root, 'src/services/DownloadManager.ts'), 'utf8');
  assert.match(src, /deletePartialFile/);
  assert.match(src, /availableDiskSpace/);
});

test('Package version is 1.0.1', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.equal(pkg.version, '1.0.1');
  assert.equal(app.expo.version, '1.0.1');
  assert.equal(app.expo.android.versionCode, 18);
});

test('No invented catalog sha256 fields', () => {
  const catalog = fs.readFileSync(path.join(root, 'src/data/catalog.ts'), 'utf8');
  assert.doesNotMatch(catalog, /sha256\s*:/);
  assert.match(catalog, /Never invent hashes/);
});
