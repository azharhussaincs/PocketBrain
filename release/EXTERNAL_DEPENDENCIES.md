# EXTERNAL_DEPENDENCIES.md

**Date:** 2026-07-30 · Phase 13 (list still authoritative; app packaging **1.9.3** / `versionCode` **16**)  
**Version:** 1.9.3 / `versionCode` 16  

Everything below **cannot** be completed inside the git repository alone.

| # | Description | Owner | Account / service | Prerequisites | Est. time | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | Host static Privacy/Terms/Contact/Licenses/AI disclaimer | Web operator | Domain `pocketbrain.app` + Vercel/Netlify/CF/S3 | DNS access; `store/legal/HOSTING.md` | 1–4 h | **Critical** |
| E1b | Domain + SSL verification | Web operator | DNS + TLS cert | Domain ownership | 0.5–2 h | **Critical** |
| E2 | Create upload keystore **or** EAS Android credentials | Release engineer | Expo account and/or `keytool` | `APP_SIGNING.md` | 0.5–2 h | **Critical** |
| E3 | Produce signed production AAB | Release engineer | EAS or local SDK + E2 | `verify:all` green | 0.5–2 h | **Critical** |
| E4 | Play App Signing enrollment | Play Console admin | Google Play Developer ($ one-time) | Developer account verified | 0.5 h | **Critical** |
| E5 | Physical Android device QA | QA | Phone API 26+, USB/`adb` | RC binary from E3 | 4–16 h | **Critical** |
| E6 | Capture ≥2 real screenshots | QA | Device + capture guide | E5 smoke PASS | 1–3 h | **Critical** (Production listing) |
| E7 | GGUF/OCR/STT/export hardware verification | QA | Same as E5 | Native build + small GGUF | Included in E5 | **High** |
| E8 | Data Safety form in Console | Compliance | Play Console | E1 live policy URL | 1–2 h | **High** |
| E9 | Content Rating questionnaire | Compliance | Play Console / IARC | — | 0.5–1 h | **High** |
| E10 | Ads / Ad ID / App content / Target audience / Gov/Finance/Health | Compliance | Play Console | — | 0.5–1 h | **High** |
| E11 | Store listing entry + AAB upload + Internal testing rollout | Release manager | Play Console | E1–E5 minimum | 1–3 h | **Critical** |
| E12 | Verify support email receives mail | Ops | Mailbox for `support@pocketbrain.app` | DNS MX | 0.25 h | **Medium** |
| E13 | Full local Android SDK (optional if EAS) | DevOps | Android Studio SDK 35 | Disk space | 1–4 h | **Medium** |

## Before Internal Testing (minimum)

E1 (+ E1b) · E2 · E3 · E4 · E5 (P0 smoke) · E11 (Internal track)

## Before Production

All of the above + E6 screenshots + E7 multimodal sample + E8–E10 declarations + Closed testing confidence + staged rollout.

## Phase 18 execution playbooks

See `EXTERNAL_VALIDATION_PLAN.md` and `FINAL_EXECUTION_CHECKLIST.md` for step-by-step external execution.

## Repository already provides

Static legal HTML, signing plugin, EAS profile, QA/screenshot/Play guides, `DEPLOYMENT_RUNBOOK.md`, `PLAYSTORE_SUBMISSION_GUIDE.md`, `npm run verify:all`.
