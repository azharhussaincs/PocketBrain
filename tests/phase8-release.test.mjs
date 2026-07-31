import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('Phase 8 brand kit files exist', () => {
  for (const rel of [
    'assets/brand/logo.svg',
    'assets/brand/BRAND_GUIDE.md',
    'assets/brand/logo-1024.png',
    'assets/play/feature-graphic.png',
    'assets/play/icon-512.png',
    'assets/notification-icon.png',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} missing`);
  }
});

test('Phase 8 release package documents exist', () => {
  for (const rel of [
    'release/RELEASE_CHECKLIST.md',
    'release/PLAY_STORE_SUBMISSION_CHECKLIST.md',
    'release/APP_SIGNING.md',
    'release/DATA_SAFETY_CHECKLIST.md',
    'release/PRIVACY_CHECKLIST.md',
    'release/TEST_REPORT.md',
    'release/QA_REPORT.md',
    'release/KNOWN_LIMITATIONS.md',
    'release/THIRD_PARTY_DEPENDENCY_INVENTORY.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} missing`);
  }
});

test('Play listing does not overclaim image generation as ready', () => {
  const listing = fs.readFileSync(path.join(root, 'store/play/LISTING.md'), 'utf8');
  assert.match(listing, /gated|will not invent|honest/i);
});

test('android allowBackup is disabled in app.json', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.equal(app.expo.android.allowBackup, false);
});
