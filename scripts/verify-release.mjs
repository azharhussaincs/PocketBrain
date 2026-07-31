import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const pkg = readJson('package.json');
const app = readJson('app.json');
const readme = readText('README.md');
const listing = readText('store/play/LISTING.md');
const releaseNotes = readText('store/play/RELEASE_NOTES.md');

const version = pkg.version;
const expoVersion = app.expo?.version;
const versionCode = app.expo?.android?.versionCode;
const permissions = app.expo?.android?.permissions ?? [];
const deps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

assert(version, 'package.json version is missing');
assert(expoVersion === version, `Version mismatch: package.json=${version} app.json=${expoVersion}`);
assert(
  readme.includes(`App version: **${version}**`) || readme.includes(`App version: **${version}** (`),
  `README does not mention app version ${version}`,
);
assert(
  listing.includes(`currently ${version}`),
  `Play listing version note is not updated to ${version}`,
);
assert(
  releaseNotes.includes(`# PocketBrain ${version}`),
  `Release notes header does not match version ${version}`,
);

const unexpectedPermissions = permissions.filter(
  (permission) => !['INTERNET', 'ACCESS_NETWORK_STATE'].includes(permission),
);
assert(
  unexpectedPermissions.length === 0,
  `Unexpected Android permissions: ${unexpectedPermissions.join(', ')}`,
);

const forbiddenDeps = Object.keys(deps).filter((name) =>
  /(firebase|supabase|amplitude|mixpanel|segment|sentry|bugsnag|datadog)/i.test(name),
);
assert(forbiddenDeps.length === 0, `Unexpected telemetry/backend dependency: ${forbiddenDeps.join(', ')}`);

assert(
  readme.includes('## Release Readiness Report'),
  'README is missing the Release Readiness Report section',
);
assert(
  readme.includes('## Project Completion Assessment'),
  'README is missing the Project Completion Assessment section',
);
assert(
  readme.includes('## Phase 10') ||
    readme.includes('Phase 10') ||
    readme.includes('Phase 11') ||
    readme.includes('## Phase 11'),
  'README is missing Phase 10/11 coverage',
);
assert(
  fs.existsSync(path.join(root, 'release/FINAL_STATUS.md')),
  'release/FINAL_STATUS.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/FINAL_RELEASE_AUDIT.md')),
  'release/FINAL_RELEASE_AUDIT.md is missing',
);
assert(fs.existsSync(path.join(root, 'eas.json')), 'eas.json is missing');
assert(
  fs.existsSync(path.join(root, 'assets/brand/BRAND_GUIDELINES.md')),
  'Brand guidelines missing',
);
assert(
  fs.existsSync(path.join(root, 'assets/brand/icon-master.svg')),
  'icon-master.svg missing',
);
assert(
  fs.existsSync(path.join(root, 'assets/brand/logo-horizontal.svg')),
  'logo-horizontal.svg missing',
);
assert(
  fs.existsSync(path.join(root, 'assets/play/feature-graphic.svg')),
  'feature-graphic.svg missing',
);
assert(
  fs.existsSync(path.join(root, 'release/PLAY_STORE_SUBMISSION.md')),
  'release/PLAY_STORE_SUBMISSION.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/DATA_SAFETY.md')),
  'release/DATA_SAFETY.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/CONTENT_RATING.md')),
  'release/CONTENT_RATING.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/REVIEW_NOTES.md')),
  'release/REVIEW_NOTES.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/PERMISSIONS.md')),
  'release/PERMISSIONS.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/RELEASE_CHECKLIST.md')),
  'release/RELEASE_CHECKLIST.md is missing',
);
assert(fs.existsSync(path.join(root, 'assets/brand/logo.svg')), 'Brand SVG logo is missing');
assert(fs.existsSync(path.join(root, 'assets/brand/BRAND_GUIDE.md')), 'Brand guide is missing');

assert(
  fs.existsSync(path.join(root, 'plugins/withAndroidReleaseSigning.js')),
  'Android release signing config plugin is missing',
);
assert(fs.existsSync(path.join(root, 'release/APP_SIGNING.md')), 'release/APP_SIGNING.md is missing');
assert(
  fs.existsSync(path.join(root, 'release/SCREENSHOT_CAPTURE_GUIDE.md')),
  'release/SCREENSHOT_CAPTURE_GUIDE.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/DEVICE_QA_CHECKLIST.md')),
  'release/DEVICE_QA_CHECKLIST.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/HARDWARE_VERIFICATION_PLAN.md')),
  'release/HARDWARE_VERIFICATION_PLAN.md is missing',
);
assert(
  fs.existsSync(path.join(root, 'release/PLAYSTORE_PRE_SUBMISSION.md')),
  'release/PLAYSTORE_PRE_SUBMISSION.md is missing',
);
assert(fs.existsSync(path.join(root, 'store/legal/privacy.html')), 'store/legal/privacy.html is missing');
assert(fs.existsSync(path.join(root, 'store/legal/terms.html')), 'store/legal/terms.html is missing');
assert(fs.existsSync(path.join(root, 'store/legal/HOSTING.md')), 'store/legal/HOSTING.md is missing');
assert(
  fs.existsSync(path.join(root, 'store/legal/ai-disclaimer.html')),
  'store/legal/ai-disclaimer.html is missing',
);
assert(
  fs.existsSync(path.join(root, 'store/legal/licenses.html')),
  'store/legal/licenses.html is missing',
);

const hasPrivacyUrl = typeof app.expo?.extra?.privacyPolicyUrl === 'string';
const hasTermsUrl = typeof app.expo?.extra?.termsUrl === 'string';
assert(hasPrivacyUrl, 'privacyPolicyUrl is missing from app.json');
assert(hasTermsUrl, 'termsUrl is missing from app.json');

const hasLlamaDep = Object.prototype.hasOwnProperty.call(pkg.dependencies ?? {}, 'llama.rn');
assert(hasLlamaDep, 'llama.rn must be installed as a production dependency for GGUF inference');

const plugins = app.expo?.plugins ?? [];
const hasLlamaPlugin = plugins.some(
  (plugin) => plugin === 'llama.rn' || (Array.isArray(plugin) && plugin[0] === 'llama.rn'),
);
assert(hasLlamaPlugin, 'app.json must register the llama.rn Expo config plugin');

const hasSigningPlugin = plugins.some(
  (plugin) =>
    plugin === './plugins/withAndroidReleaseSigning.js' ||
    (Array.isArray(plugin) && plugin[0] === './plugins/withAndroidReleaseSigning.js'),
);
assert(hasSigningPlugin, 'app.json must register ./plugins/withAndroidReleaseSigning.js');

assert(fs.existsSync(path.join(root, 'release/EXTERNAL_DEPENDENCIES.md')), 'EXTERNAL_DEPENDENCIES.md missing');
assert(fs.existsSync(path.join(root, 'release/RELEASE_CANDIDATE_REPORT.md')), 'RELEASE_CANDIDATE_REPORT.md missing');
assert(
  readme.includes('Phase 12') || readme.includes('## Phase 12') || readme.includes('Phase 13'),
  'README is missing Phase 12/13 coverage',
);
assert(fs.existsSync(path.join(root, 'release/PLAYSTORE_SUBMISSION_GUIDE.md')), 'PLAYSTORE_SUBMISSION_GUIDE.md missing');
assert(fs.existsSync(path.join(root, 'release/DEPLOYMENT_RUNBOOK.md')), 'DEPLOYMENT_RUNBOOK.md missing');
assert(fs.existsSync(path.join(root, 'release/RELEASE_READINESS_MATRIX.md')), 'RELEASE_READINESS_MATRIX.md missing');
assert(fs.existsSync(path.join(root, 'release/RISK_ASSESSMENT.md')), 'RISK_ASSESSMENT.md missing');
assert(fs.existsSync(path.join(root, 'release/REPOSITORY_FREEZE.md')), 'REPOSITORY_FREEZE.md missing');
assert(fs.existsSync(path.join(root, 'release/PLAYSTORE_REHEARSAL.md')), 'PLAYSTORE_REHEARSAL.md missing');
assert(fs.existsSync(path.join(root, 'release/PRODUCTION_HANDOFF.md')), 'PRODUCTION_HANDOFF.md missing');
assert(readme.includes('Phase 14') || readme.includes('Repository Completion'), 'README missing Phase 14 / separate scores');
assert(fs.existsSync(path.join(root, 'release/ENGINEERING_REVIEW.md')), 'ENGINEERING_REVIEW.md missing');
assert(fs.existsSync(path.join(root, 'release/SECURITY_REVIEW.md')), 'SECURITY_REVIEW.md missing');
assert(fs.existsSync(path.join(root, 'release/DEPENDENCY_AUDIT.md')), 'DEPENDENCY_AUDIT.md missing');
assert(fs.existsSync(path.join(root, 'release/TEST_REVIEW.md')), 'TEST_REVIEW.md missing');
assert(readme.includes('Phase 15') || readme.includes('Engineering Excellence'), 'README missing Phase 15');
assert(fs.existsSync(path.join(root, 'release/RELEASE_GATE_REPORT.md')), 'RELEASE_GATE_REPORT.md missing');
assert(fs.existsSync(path.join(root, 'release/INDEPENDENT_PRODUCTION_AUDIT.md')), 'INDEPENDENT_PRODUCTION_AUDIT.md missing');
assert(readme.includes('Phase 16') || readme.includes('Independent Production Audit'), 'README missing Phase 16');
assert(fs.existsSync(path.join(root, 'release/FINAL_RELEASE_HANDOFF.md')), 'FINAL_RELEASE_HANDOFF.md missing');
assert(readme.includes('Phase 17') || readme.includes('External Validation'), 'README missing Phase 17');
assert(fs.existsSync(path.join(root, 'release/EXTERNAL_VALIDATION_PLAN.md')), 'EXTERNAL_VALIDATION_PLAN.md missing');
assert(fs.existsSync(path.join(root, 'release/FINAL_EXECUTION_CHECKLIST.md')), 'FINAL_EXECUTION_CHECKLIST.md missing');
assert(fs.existsSync(path.join(root, 'release/FINAL_RELEASE_CERTIFICATE.md')), 'FINAL_RELEASE_CERTIFICATE.md missing');
assert(readme.includes('Phase 18') || readme.includes('External Validation & Google Play'), 'README missing Phase 18');


const summary = [
  `version=${version}`,
  `androidVersionCode=${versionCode}`,
  `permissions=${permissions.join(', ') || 'none'}`,
  `llama.rn dependency=${hasLlamaDep ? 'present' : 'missing'}`,
  `llama.rn plugin=${hasLlamaPlugin ? 'present' : 'missing'}`,
  `releaseSigningPlugin=${hasSigningPlugin ? 'present' : 'missing'}`,
];

console.log('Release verification passed.');
for (const line of summary) {
  console.log(`- ${line}`);
}
