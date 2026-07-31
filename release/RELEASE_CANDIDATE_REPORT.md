# RELEASE_CANDIDATE_REPORT.md

**Phase:** 12 — Real Device Validation Prep & Play Console Readiness  
**Date:** 2026-07-30  
**Marketing version:** **1.8.0**  
**Android `versionCode`:** **12**  
**Package:** `com.pocketbrain.app`  

---

## RC definition (this phase)

PocketBrain **1.8.0** is a **Repository Release Candidate**:

- All reasonable in-repo release blockers are resolved or automated.  
- Remaining work is exclusively listed in [`EXTERNAL_DEPENDENCIES.md`](EXTERNAL_DEPENDENCIES.md).  
- The app is **not** Play-submitted and **not** hardware-verified.

---

## Automated validation (this session)

| Suite | Command | Expected |
| --- | --- | --- |
| Master release | `npm run verify:release` | PASS |
| Assets | `npm run verify:assets` | PASS (+ WARN no screenshots) |
| Legal | `npm run verify:legal` | PASS (+ WARN live hosting external) |
| Branding | `npm run verify:branding` | PASS |
| Docs | `npm run verify:docs` | PASS |
| Playstore pack | `npm run verify:playstore` | PASS (+ WARN screenshots) |
| Android config | `npm run verify:android` | PASS (after prebuild) |
| Build | `npm run verify:build` | SKIP without credentials (not a code failure) |
| All | `npm run verify:all` | PASS if above hold |
| Unit/policy | `npm test` | PASS |
| Types | `npm run lint` | PASS |

---

## Play assets inventory

| Asset | Status |
| --- | --- |
| App / adaptive / mono / notification / splash | Present |
| Feature graphic 1024×500 | Present |
| Icon 512×512 | Present |
| Brand guidelines + SVG masters | Present |
| Screenshot templates | Present |
| Real phone screenshots | **Missing** (only missing visual asset) |
| Listing + release notes | Present (synced to 1.8.0) |
| Legal HTML | Present (not claimed live) |

---

## Android release path

| Check | Status |
| --- | --- |
| Signing plugin fail-closed | Present |
| EAS production `app-bundle` | Present |
| minSdk 26 / targetSdk 35 | Configured |
| Minimal permissions | Configured |
| `allowBackup: false` | Configured |
| Signed AAB produced | **Not in this environment** (credentials external) |

---

## Accessibility / performance (Phase 12 micro-changes)

| Change | File |
| --- | --- |
| Empty-state CTA min height 44 + a11y label | `src/components/EmptyState.tsx` |
| Response action icons size 20 + min 44 touch + hints | `src/components/ResponseActions.tsx` |
| Tab `tabBarAccessibilityLabel` for all tabs | `src/app/navigation/RootNavigator.tsx` |

TalkBack matrix and performance profiling remain **EXTERNAL** (device).

---

## Decision pointer

See [`FINAL_RELEASE_DECISION.md`](FINAL_RELEASE_DECISION.md).
