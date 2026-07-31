#!/usr/bin/env node
/**
 * Validates Android release configuration in repo + generated android/ (if present).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createReporter } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:android');

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));

if (app.expo?.version === pkg.version) r.pass('version-sync', pkg.version);
else r.fail('version-sync', `${pkg.version} vs ${app.expo?.version}`);

const vc = app.expo?.android?.versionCode;
if (typeof vc === 'number' && vc >= 1) r.pass('versionCode', String(vc));
else r.fail('versionCode', 'missing');

const plugins = app.expo?.plugins ?? [];
const buildProps = plugins.find((p) => Array.isArray(p) && p[0] === 'expo-build-properties');
const androidProps = buildProps?.[1]?.android ?? {};
if (androidProps.minSdkVersion === 26) r.pass('minSdk', '26');
else r.fail('minSdk', String(androidProps.minSdkVersion));
if (androidProps.targetSdkVersion === 35) r.pass('targetSdk', '35');
else r.fail('targetSdk', String(androidProps.targetSdkVersion));
if (androidProps.compileSdkVersion === 35) r.pass('compileSdk', '35');
else r.warn('compileSdk', String(androidProps.compileSdkVersion));

const perms = app.expo?.android?.permissions ?? [];
const unexpected = perms.filter((p) => !['INTERNET', 'ACCESS_NETWORK_STATE'].includes(p));
if (unexpected.length === 0) r.pass('permissions', perms.join(', ') || 'none');
else r.fail('permissions', unexpected.join(', '));

if (app.expo?.android?.allowBackup === false) r.pass('allowBackup', 'false');
else r.fail('allowBackup', 'must be false');

const hasSigningPlugin = plugins.some(
  (p) =>
    p === './plugins/withAndroidReleaseSigning.js' ||
    (Array.isArray(p) && p[0] === './plugins/withAndroidReleaseSigning.js'),
);
if (hasSigningPlugin) r.pass('signing-plugin', 'registered');
else r.fail('signing-plugin', 'missing');

if (eas.build?.production?.android?.buildType === 'app-bundle') {
  r.pass('eas-aab', 'production app-bundle');
} else {
  r.fail('eas-aab', 'missing');
}

const gradlePath = path.join(root, 'android/app/build.gradle');
if (!fs.existsSync(gradlePath)) {
  r.warn('gradle', 'android/ not present — run npx expo prebuild -p android');
} else {
  const g = fs.readFileSync(gradlePath, 'utf8');
  if (g.includes('PocketBrain release signing (Phase 11)')) {
    r.pass('gradle-signing-marker', 'Phase 11 signing present');
  } else {
    r.fail('gradle-signing-marker', 'signing plugin not applied — re-run prebuild');
  }
  if (g.includes('signingConfigs.release') || /release\s*\{[\s\S]*pbHasReleaseCreds/.test(g)) {
    r.pass('gradle-release-config', 'release signingConfigs present');
  } else {
    r.fail('gradle-release-config', 'release signingConfigs missing');
  }

  // Ensure release buildType does not hard-assign debug
  const after = g.split(/buildTypes\s*\{/)[1] || '';
  const releaseMatch = after.match(/release\s*\{([\s\S]*?)\n\s*(debug\s*\{|\})/);
  const body = releaseMatch?.[1] ?? '';
  if (/signingConfig\s+signingConfigs\.debug/.test(body)) {
    r.fail('gradle-no-debug-release', 'release still uses signingConfigs.debug');
  } else {
    r.pass('gradle-no-debug-release', 'release does not hardcode debug signing');
  }

  if (g.includes(`versionName "${pkg.version}"`) || g.includes(`versionName '${pkg.version}'`)) {
    r.pass('gradle-versionName', pkg.version);
  } else {
    r.fail('gradle-versionName', `expected ${pkg.version} — re-run prebuild`);
  }
  if (g.includes(`versionCode ${vc}`)) r.pass('gradle-versionCode', String(vc));
  else r.fail('gradle-versionCode', `expected ${vc} — re-run prebuild`);

  if (/minifyEnabled/.test(g)) r.pass('proguard-hook', 'minifyEnabled wired (flag-controlled)');
  else r.warn('proguard-hook', 'minifyEnabled not found');
}

const pluginSrc = fs.readFileSync(
  path.join(root, 'plugins/withAndroidReleaseSigning.js'),
  'utf8',
);
if (pluginSrc.includes('PB_UPLOAD_STORE_FILE') && pluginSrc.includes('GradleException')) {
  r.pass('plugin-fail-closed', 'credentials required for release');
} else {
  r.fail('plugin-fail-closed', 'plugin incomplete');
}

r.summary();
