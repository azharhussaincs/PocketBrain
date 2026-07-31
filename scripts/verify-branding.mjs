#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createReporter } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:branding');

const required = [
  'assets/brand/BRAND_GUIDELINES.md',
  'assets/brand/BRAND_GUIDE.md',
  'assets/brand/icon-master.svg',
  'assets/brand/logo.svg',
  'assets/brand/logo-horizontal.svg',
  'assets/brand/logo-light.svg',
  'assets/brand/logo-dark.svg',
  'assets/brand/logo-monochrome.svg',
  'assets/brand/adaptive-foreground.svg',
  'assets/brand/adaptive-background.svg',
  'assets/brand/splash.svg',
  'assets/brand/notification-icon.svg',
];

for (const rel of required) {
  if (fs.existsSync(path.join(root, rel))) r.pass(rel, 'present');
  else r.fail(rel, 'missing');
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.['export:brand']) r.pass('export:brand', 'npm script present');
else r.fail('export:brand', 'npm script missing');

r.summary();
