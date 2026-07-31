import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Final release certificate pack exists', () => {
  for (const rel of [
    'release/FINAL_RELEASE_CERTIFICATE.md',
    'release/FINAL_REPOSITORY_STATUS.md',
    'release/FINAL_EXTERNAL_ACTIONS.md',
    'release/FINAL_PLAYSTORE_UPLOAD_CHECKLIST.md',
    'release/FINAL_PROJECT_SUMMARY.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  }
});

test('Certificate ends development lifecycle', () => {
  const c = fs.readFileSync(path.join(root, 'release/FINAL_RELEASE_CERTIFICATE.md'), 'utf8');
  assert.match(c, /repository development lifecycle is complete/i);
  assert.match(c, /Awaiting External Execution/);
  assert.doesNotMatch(c, /Ready for Production\n/);
});
