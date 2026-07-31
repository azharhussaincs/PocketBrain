#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createReporter } from './lib/report.mjs';

const root = process.cwd();
const r = createReporter('verify:docs');

const required = [
  'README.md',
  'AGENTS.md',
  'release/APP_SIGNING.md',
  'release/DATA_SAFETY.md',
  'release/CONTENT_RATING.md',
  'release/PERMISSIONS.md',
  'release/REVIEW_NOTES.md',
  'release/PLAY_STORE_SUBMISSION.md',
  'release/PLAYSTORE_PRE_SUBMISSION.md',
  'release/DEVICE_QA_CHECKLIST.md',
  'release/HARDWARE_VERIFICATION_PLAN.md',
  'release/SCREENSHOT_CAPTURE_GUIDE.md',
  'release/KNOWN_LIMITATIONS.md',
  'release/OPEN_SOURCE_LICENSE_INVENTORY.md',
  'release/FINAL_BLOCKERS.md',
  'release/FINAL_RELEASE_DECISION.md',
  'release/FINAL_COMPLETION_REPORT.md',
  'release/FINAL_PRODUCTION_AUDIT.md',
  'release/RELEASE_CANDIDATE_REPORT.md',
  'release/EXTERNAL_DEPENDENCIES.md',
  'release/RISK_ASSESSMENT.md',
  'release/PRODUCTION_HANDOFF.md',
  'release/PLAYSTORE_REHEARSAL.md',
  'release/REPOSITORY_FREEZE.md',
  'release/RELEASE_READINESS_MATRIX.md',
  'release/DEPLOYMENT_RUNBOOK.md',
  'release/PLAYSTORE_SUBMISSION_GUIDE.md',
  'release/TEST_REVIEW.md',
  'release/DEPENDENCY_AUDIT.md',
  'release/SECURITY_REVIEW.md',
  'release/PERFORMANCE_REVIEW.md',
  'release/ENGINEERING_REVIEW.md',
  'release/FINAL_EVIDENCE_MATRIX.md',
  'release/PLAY_POLICY_AUDIT.md',
  'release/PRODUCTION_RISK_REGISTER.md',
  'release/RELEASE_GATE_REPORT.md',
  'release/INDEPENDENT_PRODUCTION_AUDIT.md',
  'release/FINAL_RELEASE_HANDOFF.md',
  'release/FINAL_EXECUTION_CHECKLIST.md',
  'release/FINAL_PROJECT_SUMMARY.md',
  'release/FINAL_PLAYSTORE_UPLOAD_CHECKLIST.md',
  'release/FINAL_EXTERNAL_ACTIONS.md',
  'release/FINAL_REPOSITORY_STATUS.md',
  'release/FINAL_RELEASE_CERTIFICATE.md',
  'release/FINAL_RELEASE_CERTIFICATION.md',
  'release/FINAL_ACCESSIBILITY_REPORT.md',
  'release/FINAL_SECURITY_REPORT.md',
  'release/FINAL_PERFORMANCE_REPORT.md',
  'release/FINAL_PLAY_COMPLIANCE_REPORT.md',
  'release/FINAL_CODE_QUALITY_REPORT.md',
  'release/FINAL_FUNCTIONALITY_VERIFICATION.md',
  'release/FINAL_100_PERCENT_REPOSITORY_AUDIT.md',
  'release/PRODUCTION_ROLLOUT_PLAN.md',
  'release/INTERNAL_TESTING_PLAN.md',
  'release/PLAY_CONSOLE_EXECUTION_GUIDE.md',
  'release/SCREENSHOT_PRODUCTION_GUIDE.md',
  'release/DEVICE_EXECUTION_GUIDE.md',
  'release/SIGNING_EXECUTION_GUIDE.md',
  'release/LEGAL_DEPLOYMENT_GUIDE.md',
  'release/EXTERNAL_VALIDATION_PLAN.md',
  'release/DOCUMENTATION_CONSISTENCY_REPORT.md',
  'release/MODEL_INTEGRITY_REPORT.md',
  'release/REPOSITORY_HEALTH_REPORT.md',
  'release/RELEASE_ENGINEER_REPORT.md',
  'store/play/LISTING.md',
  'store/play/RELEASE_NOTES.md',
];

for (const rel of required) {
  if (fs.existsSync(path.join(root, rel))) r.pass(rel, 'present');
  else r.fail(rel, 'missing');
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (
  readme.includes(`App version: **${version}**`) ||
  readme.includes(`App version: **${version}** (`)
) {
  r.pass('readme-version', `README mentions ${version}`);
} else {
  r.fail('readme-version', `README missing App version: **${version}**`);
}

if (readme.includes('## Release Readiness Report')) r.pass('readme-release', 'section present');
else r.fail('readme-release', 'Release Readiness Report missing');

if (readme.includes('## Project Completion Assessment')) r.pass('readme-completion', 'section present');
else r.fail('readme-completion', 'Project Completion Assessment missing');

r.summary();
