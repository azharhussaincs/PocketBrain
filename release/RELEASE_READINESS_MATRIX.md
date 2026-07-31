# RELEASE_READINESS_MATRIX.md

**Date:** 2026-07-30 · Phase 14  
**Version:** 1.9.3 / `versionCode` 16  

Columns: **Verified** = objective evidence in this environment · **External** = requires outside action · **Status** = Ready / Pending / Blocked.

| Requirement | Evidence | Verified | External | Status |
| --- | --- | --- | --- | --- |
| Production signing config (fail-closed) | `withAndroidReleaseSigning.js`, `verify:android` | Yes | Credentials still external | Ready (repo) |
| Signed production AAB | `verify:build` | No (SKIP) | Yes (E2/E3) | Blocked |
| EAS production app-bundle profile | `eas.json` | Yes | Build account | Ready (repo) |
| Version sync | package/app/Gradle | Yes | — | Ready |
| minSdk 26 / targetSdk 35 | `app.json` | Yes | — | Ready |
| Permissions / allowBackup | `app.json`, `PERMISSIONS.md` | Yes | Console review | Ready (repo) |
| Privacy Policy HTML | `store/legal/privacy.html` | Yes (file) | Hosting E1 | Needs hosting |
| Terms HTML | `store/legal/terms.html` | Yes (file) | Hosting E1 | Needs hosting |
| Contact HTML | `store/legal/contact.html` | Yes (file) | Hosting E1 | Needs hosting |
| Live Privacy/Terms URL content | curl policy body | No | Yes | Blocked |
| Store listing copy | `LISTING.md` | Yes (draft) | Console paste | Ready (draft) |
| Feature graphic / 512 icon | measured PNGs | Yes | Upload | Ready |
| Phone screenshots ≥2 | `assets/play/screenshots/` | No (0 PNGs) | Yes E6 | Blocked |
| Device QA execution | `DEVICE_QA_CHECKLIST.md` | No | Yes E5 | Pending |
| Crash-free startup on device | QA A3 | No | Yes | Pending |
| Offline functionality | QA E5 | No | Yes | Pending |
| Model downloads | QA D* | No | Yes | Pending |
| Export system | QA F* | No | Yes | Pending |
| GGUF inference | Hardware plan | No | Yes E7 | Pending |
| Data Safety docs | `DATA_SAFETY.md` | Yes | Console E8 | Ready (docs) |
| Content Rating docs | `CONTENT_RATING.md` | Yes | Console E9 | Ready (docs) |
| Accessibility (repo labels) | code + ACCESSIBILITY_REVIEW | Partial | TalkBack E5 | Partial |
| Performance (repo mitigations) | FlatList, largeHeap | Partial | Profiling E5 | Partial |
| Security (no secrets in git) | `.gitignore`, audit | Yes (static) | Keystore ops | Ready (repo) |
| Ads declaration readiness | no ad SDK | Yes | Console | Ready (repo) |
| Repository freeze | `REPOSITORY_FREEZE.md` | Yes | Discipline | Ready |
| Play rehearsal map | `PLAYSTORE_REHEARSAL.md` | Yes | Console | Ready (docs) |
| Production handoff | `PRODUCTION_HANDOFF.md` | Yes | Execution | Ready (docs) |

## Why Production is not Ready

Any row **Blocked** or **Pending** under Verified=No for Critical launch gates (AAB, live legal, device P0, screenshots for Production listing).
