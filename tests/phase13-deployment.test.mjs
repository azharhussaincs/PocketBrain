import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 13 deployment docs exist', () => {
  for (const rel of [
    'release/PLAYSTORE_SUBMISSION_GUIDE.md',
    'release/DEPLOYMENT_RUNBOOK.md',
    'release/RELEASE_READINESS_MATRIX.md',
    'release/RISK_ASSESSMENT.md',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test('Phase 13 docs mention deployment pipeline', () => {
  const runbook = fs.readFileSync(path.join(root, 'release/DEPLOYMENT_RUNBOOK.md'), 'utf8');
  assert.match(runbook, /eas build|bundleRelease/i);
});

test('verify reporter documents EXTERNAL on skip API', () => {
  const src = fs.readFileSync(path.join(root, 'scripts/lib/report.mjs'), 'utf8');
  assert.match(src, /EXTERNAL/);
  assert.match(src, /skip\(/);
});
