import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('Phase 10 SVG brand masters exist', () => {
  for (const rel of [
    'assets/brand/icon-master.svg',
    'assets/brand/logo.svg',
    'assets/brand/logo-light.svg',
    'assets/brand/logo-dark.svg',
    'assets/brand/logo-monochrome.svg',
    'assets/brand/logo-transparent.svg',
    'assets/brand/logo-horizontal.svg',
    'assets/brand/adaptive-foreground.svg',
    'assets/brand/adaptive-background.svg',
    'assets/brand/notification-icon.svg',
    'assets/brand/splash.svg',
    'assets/brand/BRAND_GUIDELINES.md',
    'assets/play/feature-graphic.svg',
    'assets/play/screenshot-templates/phone-frame.svg',
    'release/FINAL_RELEASE_AUDIT.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} missing`);
  }
});

test('FINAL_RELEASE_AUDIT does not recommend production', () => {
  const doc = fs.readFileSync(path.join(root, 'release/FINAL_RELEASE_AUDIT.md'), 'utf8');
  assert.match(doc, /NOT READY/);
  assert.match(doc, /Production[\s\S]*NOT READY/);
});

test('no fabricated screenshot PNGs in screenshots folder', () => {
  const dir = path.join(root, 'assets/play/screenshots');
  const pngs = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    : [];
  assert.equal(pngs.length, 0);
});
