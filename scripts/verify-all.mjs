#!/usr/bin/env node
/**
 * Master Phase 12/13 release validation — runs all verify suites.
 * verify:build SKIPs gracefully without credentials (exit 0 for that suite).
 *
 * Exit codes:
 *   0 — all suites passed (WARNs/SKIPs allowed)
 *   1 — one or more suites reported FAIL
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const suites = [
  'scripts/verify-release.mjs',
  'scripts/verify-assets.mjs',
  'scripts/verify-legal.mjs',
  'scripts/verify-branding.mjs',
  'scripts/verify-docs.mjs',
  'scripts/verify-playstore.mjs',
  'scripts/verify-android.mjs',
  'scripts/verify-build.mjs',
];

console.log('PocketBrain verify:all');
console.log(
  'Legend: PASS=met | FAIL=repo defect | WARN=incomplete (often external) | SKIP=needs external dep',
);
console.log('');

let failed = 0;
for (const rel of suites) {
  console.log(`\n>>>>>> ${rel}`);
  const res = spawnSync(process.execPath, [path.join(root, rel)], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (res.status !== 0) failed += 1;
}

console.log('\n====== verify:all summary ======');
if (failed === 0) {
  console.log('ALL SUITES PASSED (WARN/SKIP allowed; FAIL would block)');
  console.log('External blockers are listed in release/EXTERNAL_DEPENDENCIES.md');
} else {
  console.log(`${failed} suite(s) FAILED — fix repository defects before claiming RC`);
}
process.exit(failed === 0 ? 0 : 1);
