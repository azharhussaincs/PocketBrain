import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'release/EXTERNAL_VALIDATION_PLAN.md',
  'release/LEGAL_DEPLOYMENT_GUIDE.md',
  'release/SIGNING_EXECUTION_GUIDE.md',
  'release/DEVICE_EXECUTION_GUIDE.md',
  'release/SCREENSHOT_PRODUCTION_GUIDE.md',
  'release/PLAY_CONSOLE_EXECUTION_GUIDE.md',
  'release/INTERNAL_TESTING_PLAN.md',
  'release/PRODUCTION_ROLLOUT_PLAN.md',
  'release/FINAL_EXECUTION_CHECKLIST.md',
];

test('Phase 18 execution playbooks exist', () => {
  for (const rel of FILES) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test('Phase 18 states repository development is complete', () => {
  const text = fs.readFileSync(path.join(root, 'release/FINAL_EXECUTION_CHECKLIST.md'), 'utf8');
  assert.match(text, /Repository development is complete/);
  assert.match(text, /external execution/i);
});

test('Legal deployment guide does not claim live hosting', () => {
  const text = fs.readFileSync(path.join(root, 'release/LEGAL_DEPLOYMENT_GUIDE.md'), 'utf8');
  assert.match(text, /Deployment is not claimed/);
});
