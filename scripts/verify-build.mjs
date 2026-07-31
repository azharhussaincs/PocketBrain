#!/usr/bin/env node
/**
 * Attempt production AAB/APK validation.
 * If signing credentials are missing, exit 0 with SKIP — not a code failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createReporter } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:build');

const hasEnv =
  process.env.PB_UPLOAD_STORE_FILE &&
  process.env.PB_UPLOAD_STORE_PASSWORD &&
  process.env.PB_UPLOAD_KEY_ALIAS &&
  process.env.PB_UPLOAD_KEY_PASSWORD;

const propsPath = path.join(root, 'android/keystore.properties');
const hasProps = fs.existsSync(propsPath);

if (!hasEnv && !hasProps) {
  r.skip(
    'credentials',
    'No PB_UPLOAD_* env and no android/keystore.properties — cannot produce signed AAB in this environment',
    'Create upload keystore or EAS credentials (EXTERNAL_DEPENDENCIES E2); see release/APP_SIGNING.md',
  );
  r.pass('required-creds-docs', 'See release/APP_SIGNING.md for PB_UPLOAD_* / EAS credentials');
  console.log('');
  console.log('NOTE: SKIP is expected without secrets. Exit code 0 — not a repository failure.');
  r.summary();
  process.exit(0);
}

r.pass('credentials', hasEnv ? 'PB_UPLOAD_* present' : 'keystore.properties present');

const gradle = path.join(root, 'android/gradlew');
if (!fs.existsSync(gradle)) {
  r.fail('gradlew', 'android/ missing — run npx expo prebuild -p android first');
  r.summary();
  process.exit(1);
}

console.log('Running ./gradlew :app:bundleRelease …');
const result = spawnSync('./gradlew', [':app:bundleRelease', '--quiet'], {
  cwd: path.join(root, 'android'),
  encoding: 'utf8',
  env: process.env,
  timeout: 30 * 60 * 1000,
});

if (result.status === 0) {
  const aab = path.join(
    root,
    'android/app/build/outputs/bundle/release/app-release.aab',
  );
  if (fs.existsSync(aab)) r.pass('aab', aab);
  else r.warn('aab', 'bundleRelease succeeded but AAB path not found at default location');
} else {
  r.fail(
    'bundleRelease',
    (result.stderr || result.stdout || 'gradle failed').slice(0, 500),
  );
}

r.summary();
