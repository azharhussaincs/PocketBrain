# Google Play Policy Audit — Phase 16

**Date:** 2026-07-30  
**App:** PocketBrain **1.9.2** / `versionCode` **15**  
**Scope:** Repository evidence + live probe of configured policy URLs.  
**Non-claim:** This is **not** a Play approval prediction.

---

## Policy areas

| Area | Repo evidence | Live / Console evidence | Status |
| --- | --- | --- | --- |
| Privacy Policy | `store/legal/privacy.html`; in-app `policies.ts` / Settings | Configured URL returns **SPA shell**, not policy body | ❌ Failed (live) |
| Terms of Service | `store/legal/terms.html`; in-app | Same SPA pattern | ❌ Failed (live) |
| Contact | `store/legal/contact.html`; `support@pocketbrain.app` in README | Mailbox delivery Not Verified | ⚠ External |
| AI disclosure | `store/legal/ai-disclaimer.html`; onboarding consent; Settings | In-app ✅; live hosting same as legal | ⚠ Partial |
| Permission rationale | `release/PERMISSIONS.md`; iOS usage strings; Expo plugin permission strings | Runtime denial UX partially coded | ✅ Repo / ⏳ Device |
| Data Safety | `release/DATA_SAFETY.md` (draft; header still 1.5.1) | Console form Not Verified | ⚠ External |
| Accessibility | Labels, font scaling, touch targets in code; `ACCESSIBILITY_REVIEW.md` | TalkBack Not Verified | ⏳ Not Verified |
| App functionality | Feature screens present; honesty gates for image gen / mock | Device function Not Verified | ⏳ Not Verified |
| Deceptive behavior | Listing gates vision/image claims; image gen refuses fake pixels | Vision URI-text path undermines vision honesty | ❌ Residual (Vision) |
| Placeholder content | Screenshot folder forbids fabricated PNGs; 0 screenshots | Cannot ship Production listing without real captures | ❌ Failed (assets) |
| Honest feature descriptions | `store/play/LISTING.md` cautious language | Must match actual Vision/OCR/STT behavior on device | ⚠ Needs External Validation |
| Ads / Ad ID | Docs claim no ads; no ads SDK in package.json | Console declarations Not Verified | ✅ Repo / ⚠ Console |
| Target audience / restricted | Docs in release pack | Console Not Verified | ⏳ Not Verified |
| Minimal permissions | INTERNET + ACCESS_NETWORK_STATE declared; sensitive perms at feature time | Manifest verify:android PASS | ✅ Verified |
| Backup | `allowBackup: false` | ✅ Verified | ✅ Verified |

---

## Critical policy findings

### 1. Privacy / Terms URL content mismatch (Critical)

Configured:

- `https://pocketbrain.app/privacy`
- `https://pocketbrain.app/terms`

Observed 2026-07-30:

- HTTP 307 → `https://pocketbrain.chat/...`
- HTTP 200 HTML is a **client SPA** titled “Pocket Brain - powered by runinbrowser-ai”
- Includes third-party Umami analytics script
- **Does not** match `store/legal/privacy.html` / `terms.html` bodies

Play reviewers (and users) following the URL will **not** see the app’s declared policy. Treat as **policy blocker**, not a green hosting check.

### 2. Screenshots absent (Critical for Production listing)

No real phone screenshots. Repository correctly refuses fabricated captures. Listing cannot be completed for Production without device captures.

### 3. Vision honesty residual (High)

Marketplace can present vision-capable models; Playground Vision mode calls `VisionService`, which sends an image **path string** to a text model. System prompt asks the model to admit limitations if it cannot see pixels — but this is still a **weak honesty posture** for a “Vision” product surface.

### 4. Download integrity optional (High / security-policy adjacent)

Without catalog checksums, users may install corrupted weights labeled installed. Not a classic Play “malware” finding, but a user-trust / quality issue.

---

## What the repository does well (do not over-credit)

- Offline-first: no mandatory account/backend/analytics SDKs in app dependencies (test-enforced).  
- Image generation refuses fabricated bitmaps.  
- In-app consent gate for Privacy/Terms/AI disclaimer.  
- Data Safety draft maps “no developer collection” consistently with architecture.  
- Listing copy avoids unrestricted image-generation claims.

---

## Auditor conclusion (policy)

**Repository drafts are largely aligned with a privacy-forward offline AI app.**  
**Live Store-facing privacy/terms content is currently unacceptable.**  
**Screenshot and device functionality evidence are missing.**  

**Do not submit to Production.** Internal Testing still requires corrected legal hosting and a signed binary with smoke QA.
