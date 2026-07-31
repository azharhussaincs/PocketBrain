import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Final 100% certification pack exists', () => {
  for (const rel of [
    'release/FINAL_100_PERCENT_REPOSITORY_AUDIT.md',
    'release/FINAL_FUNCTIONALITY_VERIFICATION.md',
    'release/FINAL_CODE_QUALITY_REPORT.md',
    'release/FINAL_PLAY_COMPLIANCE_REPORT.md',
    'release/FINAL_PERFORMANCE_REPORT.md',
    'release/FINAL_SECURITY_REPORT.md',
    'release/FINAL_ACCESSIBILITY_REPORT.md',
    'release/FINAL_RELEASE_CERTIFICATION.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  }
});

test('Certification separates repository 100% from overall product', () => {
  const c = fs.readFileSync(path.join(root, 'release/FINAL_RELEASE_CERTIFICATION.md'), 'utf8');
  assert.match(c, /Repository: 100% Complete \(Project Scope\)/);
  assert.match(c, /Awaiting External Execution/);
});
