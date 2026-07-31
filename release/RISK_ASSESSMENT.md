# RISK_ASSESSMENT.md

**Date:** 2026-07-30 · Phase 14 · PocketBrain 1.9.3  

Impact / Likelihood: **H** high · **M** medium · **L** low

## Technical

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | GGUF OOM / crash on device | H | M | P0 device QA; Marketplace RAM gates |
| R2 | OCR/STT OEM gaps | M | M | Honest unavailable errors |
| R3 | Accidental debug-signed upload | H | L | Fail-closed signing; verify:android |

## Operational

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R4 | Lost upload keystore | H | L | Play App Signing + offline backup |
| R5 | Incomplete local SDK | M | M | Prefer EAS |
| R6 | Support inbox bounce | M | L | Verify support@ (E12) |

## Legal / Policy

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R7 | Privacy URL SPA / non-policy page | H | M until E1 | Static `store/legal` hosting + curl |
| R8 | Data Safety mismatch | H | M | Mirror `DATA_SAFETY.md` |
| R9 | Overclaim vision/image gen | H | L | Listing honesty + gates |

## UX / Performance

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R10 | Dense 8-tab bar | M | M | Frozen; next version |
| R11 | Large model / long chat jank | H | M | Device profiling; existing list tuning |

## Security residual risks (Phase 14 audit)

| ID | Finding | Severity | Notes |
| --- | --- | --- | --- |
| S1 | No secrets committed in-repo (keystore gitignored) | OK | Keep `credentials/` ignored |
| S2 | Release signing requires env/properties — good fail-closed | OK | Never weaken to debug fallback |
| S3 | `INTERNET` present for model downloads | Accepted | Least privilege otherwise; mic/camera via feature plugins |
| S4 | `allowBackup: false` | OK | Reduces cloud backup of local chats/models |
| S5 | Local storage is app sandbox — not encrypted beyond OS | Residual | Documented; device encryption assumed |
| S6 | Model downloads contact third-party hosts | Residual | User-initiated; disclose in Data Safety |
| S7 | Third-party deps may have CVEs over time | Residual | Re-run `npm audit` / upgrade on security exceptions only |
| S8 | No crash/analytics SDK | OK for privacy | Relies on Play Vitals post-release |

**No critical in-repo secret exposure found in this static review.** Residual risks are operational (keystore handling) and policy (hosting/Data Safety accuracy).
