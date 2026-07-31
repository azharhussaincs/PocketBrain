#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createReporter } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:legal');

const files = [
  ['store/legal/privacy.html', /Privacy Policy/i],
  ['store/legal/terms.html', /Terms of Service/i],
  ['store/legal/contact.html', /support@pocketbrain\.app/i],
  ['store/legal/ai-disclaimer.html', /AI Disclaimer/i],
  ['store/legal/licenses.html', /Open Source Licenses|Licenses/i],
  ['store/legal/faq.html', /FAQ/i],
  ['store/legal/HOSTING.md', /Hosting|deploy/i],
];

for (const [rel, re] of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    r.fail(rel, 'missing');
    continue;
  }
  const text = fs.readFileSync(p, 'utf8');
  if (re.test(text)) r.pass(rel, 'present with expected content');
  else r.fail(rel, 'missing expected keywords');
}

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const privacy = app.expo?.extra?.privacyPolicyUrl;
const terms = app.expo?.extra?.termsUrl;
if (typeof privacy === 'string' && privacy.startsWith('https://')) r.pass('privacyPolicyUrl', privacy);
else r.fail('privacyPolicyUrl', 'missing or not https');
if (typeof terms === 'string' && terms.startsWith('https://')) r.pass('termsUrl', terms);
else r.fail('termsUrl', 'missing or not https');

r.warn(
  'live-hosting',
  'Live URL content is not verified by this script',
  'Deploy store/legal/*.html per HOSTING.md (EXTERNAL_DEPENDENCIES E1); curl must show policy body',
);

r.summary();
