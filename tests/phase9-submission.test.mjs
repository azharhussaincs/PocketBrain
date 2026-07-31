import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('Phase 9 submission documents exist', () => {
  for (const rel of [
    'release/PLAY_STORE_SUBMISSION.md',
    'release/DATA_SAFETY.md',
    'release/CONTENT_RATING.md',
    'release/REVIEW_NOTES.md',
    'release/PERMISSIONS.md',
    'release/DEVICE_COMPATIBILITY.md',
    'release/SCREENSHOT_CAPTURE_PLAN.md',
    'release/RELEASE_CHECKLIST.md',
    'release/APP_SIGNING.md',
    'release/TEST_REPORT.md',
    'release/KNOWN_LIMITATIONS.md',
    'release/CHANGELOG.md',
    'release/RELEASE_NOTES.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} missing`);
  }
});

test('Phase 9 decision does not claim production ready', () => {
  const doc = fs.readFileSync(path.join(root, 'release/PLAY_STORE_SUBMISSION.md'), 'utf8');
  assert.match(doc, /NOT READY/);
  assert.match(doc, /404/);
  assert.doesNotMatch(doc, /Ready for Production Release\n/);
});

test('short description respects Play 80-character limit', () => {
  const listing = fs.readFileSync(path.join(root, 'store/play/LISTING.md'), 'utf8');
  const match = listing.match(/## Short description[\s\S]*?\n\n([^\n]+)/);
  assert.ok(match, 'short description not found');
  assert.ok(match[1].length <= 80, `short description is ${match[1].length} chars`);
});

test('screenshots folder has no fabricated PNG captures yet', () => {
  const dir = path.join(root, 'assets/play/screenshots');
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    : [];
  assert.equal(files.length, 0, 'Unexpected screenshot images present without device capture');
});
