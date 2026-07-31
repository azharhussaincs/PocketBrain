#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createReporter, pngSize } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:assets');

const required = [
  ['assets/icon.png', 'App icon'],
  ['assets/android-icon-foreground.png', 'Adaptive foreground'],
  ['assets/android-icon-background.png', 'Adaptive background'],
  ['assets/android-icon-monochrome.png', 'Monochrome / themed icon'],
  ['assets/notification-icon.png', 'Notification icon'],
  ['assets/splash-icon.png', 'Splash image'],
  ['assets/favicon.png', 'Web favicon'],
  ['assets/play/feature-graphic.png', 'Play feature graphic'],
  ['assets/play/icon-512.png', 'Play high-res icon 512'],
  ['assets/play/feature-graphic.svg', 'Feature graphic SVG source'],
  ['assets/play/screenshots/README.md', 'Screenshots folder README'],
  ['assets/play/screenshot-templates/phone-frame.svg', 'Screenshot template'],
];

for (const [rel, label] of required) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) r.pass(rel, label);
  else r.fail(rel, `${label} missing`);
}

const fg = path.join(root, 'assets/play/feature-graphic.png');
if (fs.existsSync(fg)) {
  const s = pngSize(fg, fs);
  if (s && s.width === 1024 && s.height === 500) r.pass('feature-graphic-size', '1024×500');
  else r.fail('feature-graphic-size', `expected 1024×500 got ${s ? `${s.width}×${s.height}` : 'unknown'}`);
}

const icon512 = path.join(root, 'assets/play/icon-512.png');
if (fs.existsSync(icon512)) {
  const s = pngSize(icon512, fs);
  if (s && s.width === 512 && s.height === 512) r.pass('icon-512-size', '512×512');
  else r.fail('icon-512-size', `expected 512×512 got ${s ? `${s.width}×${s.height}` : 'unknown'}`);
}

const shotDir = path.join(root, 'assets/play/screenshots');
const pngs = fs.existsSync(shotDir)
  ? fs.readdirSync(shotDir).filter((f) => f.toLowerCase().endsWith('.png'))
  : [];
if (pngs.length === 0) {
  r.warn(
    'phone-screenshots',
    'No real phone screenshot PNGs (expected until device capture). Only missing Play visual asset.',
    'Physical device + SCREENSHOT_CAPTURE_GUIDE.md (EXTERNAL_DEPENDENCIES E5/E6)',
  );
} else {
  r.pass('phone-screenshots', `${pngs.length} PNG(s) present`);
}

r.summary();
