import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 16 audit reports exist', () => {
  for (const rel of [
    'release/INDEPENDENT_PRODUCTION_AUDIT.md',
    'release/RELEASE_GATE_REPORT.md',
    'release/PRODUCTION_RISK_REGISTER.md',
    'release/PLAY_POLICY_AUDIT.md',
    'release/FINAL_EVIDENCE_MATRIX.md',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test('Phase 16 gate is Ready for Release Engineering, not Production', () => {
  const gate = fs.readFileSync(path.join(root, 'release/RELEASE_GATE_REPORT.md'), 'utf8');
  assert.match(gate, /Repository Ready for Release Engineering/);
  assert.match(gate, /Repository Ready for Google Play Submission \| \*\*No\*\*/);
  assert.match(gate, /Repository Ready for Production \| \*\*No\*\*/);
});

test('Catalog still has no sha256 fields (integrity gap documented)', () => {
  const catalog = fs.readFileSync(path.join(root, 'src/data/catalog.ts'), 'utf8');
  assert.doesNotMatch(catalog, /sha256\s*:/);
});
