import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Phase 11 signing plugin is registered and present', () => {
  const pluginPath = path.join(root, 'plugins/withAndroidReleaseSigning.js');
  assert.equal(fs.existsSync(pluginPath), true);
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const plugins = app.expo.plugins ?? [];
  const has = plugins.some(
    (p) =>
      p === './plugins/withAndroidReleaseSigning.js' ||
      (Array.isArray(p) && p[0] === './plugins/withAndroidReleaseSigning.js'),
  );
  assert.equal(has, true);
  const src = fs.readFileSync(pluginPath, 'utf8');
  assert.match(src, /PB_UPLOAD_STORE_FILE/);
  assert.match(src, /GradleException/);
});

test('Phase 11 legal hosting pack is complete', () => {
  for (const rel of [
    'store/legal/privacy.html',
    'store/legal/terms.html',
    'store/legal/contact.html',
    'store/legal/ai-disclaimer.html',
    'store/legal/licenses.html',
    'store/legal/faq.html',
    'store/legal/HOSTING.md',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
  const privacy = fs.readFileSync(path.join(root, 'store/legal/privacy.html'), 'utf8');
  assert.match(privacy, /Privacy Policy/i);
  assert.match(privacy, /on-device|device by default/i);
});

test('Phase 11 release packaging docs exist', () => {
  for (const rel of [
    'release/SCREENSHOT_CAPTURE_GUIDE.md',
    'release/DEVICE_QA_CHECKLIST.md',
    'release/HARDWARE_VERIFICATION_PLAN.md',
    'release/PLAYSTORE_PRE_SUBMISSION.md',
    'release/APP_SIGNING.md',
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
  const signing = fs.readFileSync(path.join(root, 'release/APP_SIGNING.md'), 'utf8');
  assert.match(signing, /PB_UPLOAD_STORE_FILE/);
  assert.match(signing, /Never upload a debug-signed/);
});

test('Phase 11 does not fabricate screenshots', () => {
  const dir = path.join(root, 'assets/play/screenshots');
  const pngs = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'));
  assert.equal(pngs.length, 0);
});
