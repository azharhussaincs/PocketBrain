# Play Store Submission Guide — PocketBrain

**Authoritative Console walkthrough (Phase 13).**  
**App:** PocketBrain · `com.pocketbrain.app` · version **1.9.3** / `versionCode` **16**  
**Companion:** `PLAYSTORE_PRE_SUBMISSION.md`, `DATA_SAFETY.md`, `CONTENT_RATING.md`, `EXTERNAL_DEPENDENCIES.md`

**Rule:** Completing this guide in the Console is **external**. The repository only supplies source text and assets.

---

## Submission order (follow top → bottom)

### 1. Create App

| | |
| --- | --- |
| **Why Google asks** | Registers the listing and package identity under your developer account |
| **Repo source** | `app.json` → `android.package` = `com.pocketbrain.app`; name `PocketBrain` |
| **Manual** | Play Console → Create app → accept declarations → choose Free |

### 2–4. Store Listing / Main Store Listing / Graphics

| | |
| --- | --- |
| **Why** | Users discover and evaluate the app; graphics prove UI authenticity |
| **Repo source** | `store/play/LISTING.md` (short ≤80, full description, category Productivity); `assets/play/feature-graphic.png` (1024×500); `assets/play/icon-512.png`; `assets/icon.png` / adaptive layers; screenshots **after** device capture → `assets/play/screenshots/` |
| **Manual** | Paste listing; upload graphics; upload ≥2 phone screenshots (E6) — **do not fabricate** |

### 5. App Category

| | |
| --- | --- |
| **Why** | Store taxonomy / discovery |
| **Repo source** | LISTING.md → Productivity |
| **Manual** | Select Productivity (or closest approved category) |

### 6. Tags

| | |
| --- | --- |
| **Why** | Optional discovery signals |
| **Repo source** | LISTING.md Keywords (ASO) — use as inspiration; Console tag limits apply |
| **Manual** | Choose allowed tags honestly |

### 7. Contact Details

| | |
| --- | --- |
| **Why** | User support & policy contact |
| **Repo source** | `support@pocketbrain.app`; `store/legal/contact.html` |
| **Manual** | Enter email; optional phone/website; verify inbox receives mail (E12) |

### 8. Privacy Policy

| | |
| --- | --- |
| **Why** | User Data policy — required for apps with network/permissions |
| **Repo source** | `store/legal/privacy.html`; URL in `app.json` `extra.privacyPolicyUrl` |
| **Manual** | **Host** static HTML first (`HOSTING.md` / E1). URL must show readable policy (not SPA shell) |

### 9. App Access

| | |
| --- | --- |
| **Why** | Reviewers need to open all features |
| **Repo source** | `release/REVIEW_NOTES.md` — no login; offline-first; model download may need Wi‑Fi |
| **Manual** | Declare “All features available without special access” unless you add restricted builds |

### 10. Ads Declaration

| | |
| --- | --- |
| **Why** | Ads / Ad ID policy |
| **Repo source** | No ad SDK in `package.json`; `DATA_SAFETY.md`; monetization noop |
| **Manual** | Declare **No ads** |

### 11. Data Safety

| | |
| --- | --- |
| **Why** | Transparency for data collection/sharing |
| **Repo source** | `release/DATA_SAFETY.md` — mirror exactly |
| **Manual** | Fill Console form; disclose user-initiated model downloads to third-party hosts |

### 12. Content Rating

| | |
| --- | --- |
| **Why** | Age-appropriate labeling |
| **Repo source** | `release/CONTENT_RATING.md` |
| **Manual** | Complete IARC questionnaire for productivity / AI tool without social UGC feeds |

### 13. Target Audience

| | |
| --- | --- |
| **Why** | Families / COPPA rules |
| **Repo source** | Privacy: not directed to children under 13; do **not** enroll Designed for Families unless redesigned |
| **Manual** | Select adult / general audience consistent with docs |

### 14. Government Apps

| | |
| --- | --- |
| **Why** | Government publisher rules |
| **Repo source** | N/A — consumer productivity app |
| **Manual** | Declare **No** |

### 15. Financial Features

| | |
| --- | --- |
| **Why** | Finance policy |
| **Repo source** | No payments / IAP at launch |
| **Manual** | Declare **No** financial features |

### 16. Health Features

| | |
| --- | --- |
| **Why** | Health policy |
| **Repo source** | Not a health/medical device app |
| **Manual** | Declare **No** |

### 17. AI Disclosure (if shown)

| | |
| --- | --- |
| **Why** | Emerging AI transparency expectations |
| **Repo source** | LISTING honesty notes; `store/legal/ai-disclaimer.html`; in-app AI disclaimer |
| **Manual** | Disclose on-device AI / generative features honestly; do not claim cloud multimodal if gated |

### 18. App Signing

| | |
| --- | --- |
| **Why** | Integrity of updates |
| **Repo source** | `release/APP_SIGNING.md`; EAS or `PB_UPLOAD_*` |
| **Manual** | Enroll Play App Signing; upload with non-debug upload key (E2–E4) |

### 19. Internal Testing

| | |
| --- | --- |
| **Why** | Closed smoke before wider release |
| **Repo source** | Signed AAB; `DEVICE_QA_CHECKLIST.md` |
| **Manual** | Upload AAB; add testers; install; run P0 QA (E3, E5, E11) |

### 20. Closed Testing

| | |
| --- | --- |
| **Why** | Broader quality signal |
| **Repo source** | Same + screenshots recommended |
| **Manual** | Promote after Internal PASS; gather crash feedback |

### 21. Production Rollout

| | |
| --- | --- |
| **Why** | Public distribution |
| **Repo source** | Full pre-submission gate in `PLAYSTORE_PRE_SUBMISSION.md` |
| **Manual** | Staged % rollout; monitor Play Vitals; **no approval guarantee** |

---

## Pre-flight (all must be true before Production)

1. Legal URLs return policy **body** text  
2. Non-debug signed AAB  
3. Device P0 QA PASS  
4. ≥2 real screenshots  
5. Data Safety / rating / ads declarations filed  
6. `versionName` / `versionCode` match release notes  

Until then: **do not** claim Production readiness.
