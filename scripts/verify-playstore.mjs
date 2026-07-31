#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createReporter, pngSize } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:playstore');

const listing = fs.readFileSync(path.join(root, 'store/play/LISTING.md'), 'utf8');
const notes = fs.readFileSync(path.join(root, 'store/play/RELEASE_NOTES.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const version = pkg.version;

if (listing.includes(`currently ${version}`)) r.pass('listing-version', version);
else r.fail('listing-version', `LISTING.md not synced to ${version}`);

if (notes.includes(`# PocketBrain ${version}`)) r.pass('release-notes-version', version);
else r.fail('release-notes-version', `RELEASE_NOTES.md header mismatch`);

const shortMatch = listing.match(/## Short description[^\n]*\n\n([^\n]+)/);
const short = shortMatch?.[1]?.trim() ?? '';
if (short.length > 0 && short.length <= 80) r.pass('short-description', `${short.length} chars`);
else r.fail('short-description', `invalid length ${short.length}`);

if (/Productivity/i.test(listing)) r.pass('category', 'Productivity documented');
else r.warn('category', 'Category not found in listing');

const docs = [
  'release/DATA_SAFETY.md',
  'release/CONTENT_RATING.md',
  'release/PERMISSIONS.md',
  'release/REVIEW_NOTES.md',
  'release/OPEN_SOURCE_LICENSE_INVENTORY.md',
  'release/PLAYSTORE_PRE_SUBMISSION.md',
  'store/legal/privacy.html',
  'store/legal/terms.html',
  'store/legal/licenses.html',
  'store/legal/ai-disclaimer.html',
];
for (const rel of docs) {
  if (fs.existsSync(path.join(root, rel))) r.pass(rel, 'present');
  else r.fail(rel, 'missing');
}

const fg = path.join(root, 'assets/play/feature-graphic.png');
const ic = path.join(root, 'assets/play/icon-512.png');
const fgs = pngSize(fg, fs);
const ics = pngSize(ic, fs);
if (fgs?.width === 1024 && fgs?.height === 500) r.pass('feature-graphic', '1024×500');
else r.fail('feature-graphic', 'bad size or missing');
if (ics?.width === 512 && ics?.height === 512) r.pass('icon-512', '512×512');
else r.fail('icon-512', 'bad size or missing');

const shotDir = path.join(root, 'assets/play/screenshots');
const pngs = fs.existsSync(shotDir)
  ? fs.readdirSync(shotDir).filter((f) => f.toLowerCase().endsWith('.png'))
  : [];
if (pngs.length >= 2) r.pass('screenshots', `${pngs.length} real captures`);
else {
  r.warn(
    'screenshots',
    `Need ≥2 real phone screenshots before Production listing (found ${pngs.length})`,
    'DEVICE_QA then SCREENSHOT_CAPTURE_GUIDE.md (E5/E6)',
  );
}

if (app.expo?.android?.package === 'com.pocketbrain.app') r.pass('package', 'com.pocketbrain.app');
else r.fail('package', String(app.expo?.android?.package));

const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
if (eas.build?.production?.android?.buildType === 'app-bundle') {
  r.pass('eas-production', 'app-bundle profile');
} else {
  r.fail('eas-production', 'production profile must build app-bundle');
}

r.summary();
