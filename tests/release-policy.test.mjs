import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('package.json includes llama.rn for native GGUF builds', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  assert.ok(pkg.dependencies['llama.rn'], 'llama.rn must be a dependency');
});

test('app.json registers llama.rn Expo plugin', () => {
  const app = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8'));
  const plugins = app.expo.plugins ?? [];
  const hasLlama = plugins.some(
    (p) => p === 'llama.rn' || (Array.isArray(p) && p[0] === 'llama.rn'),
  );
  assert.ok(hasLlama, 'llama.rn plugin must be configured');
});

test('Android permissions stay minimal', () => {
  const app = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8'));
  const permissions = app.expo.android.permissions ?? [];
  for (const permission of permissions) {
    assert.ok(
      ['INTERNET', 'ACCESS_NETWORK_STATE'].includes(permission),
      `Unexpected permission ${permission}`,
    );
  }
});

test('no analytics/backend SDKs are bundled', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(deps)) {
    assert.doesNotMatch(
      name,
      /(firebase|supabase|amplitude|mixpanel|segment|sentry|bugsnag|datadog)/i,
    );
  }
});
