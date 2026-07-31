import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 12 verify scripts exist', () => {
  for (const rel of [
    'scripts/verify-assets.mjs',
    'scripts/verify-legal.mjs',
    'scripts/verify-branding.mjs',
    'scripts/verify-docs.mjs',
    'scripts/verify-playstore.mjs',
    'scripts/verify-android.mjs',
    'scripts/verify-build.mjs',
    'scripts/verify-all.mjs',
    'scripts/lib/report.mjs',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test('Phase 12 RC docs exist', () => {
  assert.equal(fs.existsSync(path.join(root, 'release/EXTERNAL_DEPENDENCIES.md')), true);
  assert.equal(fs.existsSync(path.join(root, 'release/RELEASE_CANDIDATE_REPORT.md')), true);
  const qa = fs.readFileSync(path.join(root, 'release/DEVICE_QA_CHECKLIST.md'), 'utf8');
  assert.match(qa, /Preconditions/);
  assert.match(qa, /Priority/);
  assert.match(qa, /Notes/);
});

test('package.json exposes Phase 12 verify scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of [
    'verify:assets',
    'verify:legal',
    'verify:branding',
    'verify:docs',
    'verify:playstore',
    'verify:android',
    'verify:build',
    'verify:all',
  ]) {
    assert.ok(pkg.scripts[s], s);
  }
});
