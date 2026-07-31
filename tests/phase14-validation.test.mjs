import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 14 validation docs exist', () => {
  for (const rel of [
    'release/REPOSITORY_FREEZE.md',
    'release/PLAYSTORE_REHEARSAL.md',
    'release/PRODUCTION_HANDOFF.md',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test('App version is at least Phase 14 packaging (1.0.0+ Play line)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const [maj, min] = pkg.version.split('.').map(Number);
  // Product line shipped as 1.0.x for Play; older phase docs referenced 1.9.x packaging.
  assert.ok(maj > 1 || (maj === 1 && min >= 0), pkg.version);
  assert.ok(app.expo.android.versionCode >= 14, String(app.expo.android.versionCode));
  assert.equal(pkg.version, app.expo.version);
});

test('DEVICE_QA checklist documents binary acquisition', () => {
  const qa = fs.readFileSync(path.join(root, 'release/DEVICE_QA_CHECKLIST.md'), 'utf8');
  assert.match(qa, /How to obtain the binary/);
  assert.match(qa, /1\.0\.\d+/);
});
