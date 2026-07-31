import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('Play feature graphic exists at required size metadata path', () => {
  const p = path.join(process.cwd(), 'assets/play/feature-graphic.png');
  assert.ok(fs.existsSync(p), 'feature-graphic.png missing');
  assert.ok(fs.statSync(p).size > 1000, 'feature graphic looks empty');
});

test('hostable legal HTML pages exist for Play URL publishing', () => {
  for (const name of ['privacy.html', 'terms.html']) {
    const p = path.join(process.cwd(), 'store/legal', name);
    assert.ok(fs.existsSync(p), `${name} missing`);
    const body = fs.readFileSync(p, 'utf8');
    assert.match(body, /PocketBrain/i);
  }
});

test('SYSTEM_ALERT_WINDOW is blocked in app.json for production', () => {
  const app = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8'));
  const blocked = app.expo.android.blockedPermissions ?? [];
  assert.ok(blocked.includes('android.permission.SYSTEM_ALERT_WINDOW'));
});

test('iOS deploymentTarget meets Expo 57 minimum', () => {
  const app = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8'));
  const plugins = app.expo.plugins ?? [];
  const buildProps = plugins.find((p) => Array.isArray(p) && p[0] === 'expo-build-properties');
  assert.ok(buildProps, 'expo-build-properties missing');
  const target = buildProps[1]?.ios?.deploymentTarget;
  assert.ok(target, 'ios.deploymentTarget missing');
  const [major, minor] = String(target).split('.').map(Number);
  assert.ok(major > 16 || (major === 16 && minor >= 4), `deploymentTarget ${target} < 16.4`);
});
