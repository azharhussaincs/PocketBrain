# PLAYSTORE_REHEARSAL.md

**Purpose:** Simulate a full Google Play Console submission **without** claiming any Console action was performed.  
**App:** PocketBrain · `com.pocketbrain.app` · **1.9.3** / `versionCode` **16**  
**Date:** 2026-07-30 · Phase 14  

**Legend:**  
- **Repo ready** — inputs exist in git  
- **Manual** — human must act in Console / hosting / device  
- **Blocked** — cannot proceed until external prerequisite  

---

## Rehearsal walkthrough

| # | Console page | Required inputs / uploads | Repo source | Status | Manual intervention |
| --- | --- | --- | --- | --- | --- |
| 1 | Create app | App name, language, free/paid, declarations | Name `PocketBrain` | Repo ready | Create app in developer account |
| 2 | Store listing | Short ≤80, full description | `store/play/LISTING.md` | Repo ready | Paste text |
| 3 | Graphics | Icon 512, feature graphic 1024×500 | `assets/play/icon-512.png`, `feature-graphic.png` | Repo ready | Upload files |
| 4 | Screenshots | ≥2 phone | `assets/play/screenshots/` | **Blocked** | Capture on device (E5/E6) — **0 PNGs now** |
| 5 | Category / tags | Productivity + tags | LISTING.md | Repo ready | Select in Console |
| 6 | Contact | Email, optional site | `support@pocketbrain.app` | Repo ready | Enter + verify inbox (E12) |
| 7 | Privacy Policy URL | HTTPS policy page | `store/legal/privacy.html` + URL in `app.json` | **Blocked** | Host static HTML (E1); curl body text |
| 8 | Terms (if requested) | HTTPS | `store/legal/terms.html` | **Blocked** | Same hosting |
| 9 | App access | Reviewer instructions | `REVIEW_NOTES.md` | Repo ready | Paste notes; no login |
| 10 | Ads | Yes/No | No ad SDK | Repo ready | Declare **No** |
| 11 | Data Safety | Form answers | `DATA_SAFETY.md` | Repo ready | Fill form exactly |
| 12 | Content rating | IARC | `CONTENT_RATING.md` | Repo ready | Complete questionnaire |
| 13 | Target audience | Age | Not for children under 13 | Repo ready | Select consistent audience; no Families |
| 14 | Government apps | Yes/No | N/A | Repo ready | **No** |
| 15 | Financial features | Yes/No | No IAP | Repo ready | **No** |
| 16 | Health features | Yes/No | N/A | Repo ready | **No** |
| 17 | AI disclosure | Honesty | Listing + `ai-disclaimer.html` | Repo ready | Disclose on-device AI; no overclaim |
| 18 | App signing | Upload key / Play App Signing | `APP_SIGNING.md` | **Blocked** | EAS/credentials (E2/E4) |
| 19 | Release artifact | AAB | `eas.json` production app-bundle | **Blocked** | Build signed AAB (E3) — `verify:build` SKIP here |
| 20 | Internal testing | Testers + AAB | Handoff + QA checklist | **Blocked** | Upload after E1–E5 |
| 21 | Closed testing | Wider cohort | Same | **Blocked** | After Internal PASS |
| 22 | Production | Staged rollout | Full gate | **Blocked** | After Closed + screenshots + forms |

---

## Where rehearsal stops (this environment)

1. No live Privacy/Terms content verified as static policy HTML.  
2. No upload credentials → no signed AAB.  
3. No device → no QA PASS, no screenshots.  
4. No Play Console session performed.

---

## Pass criteria to finish rehearsal “for real”

All **Blocked** rows cleared with evidence (curl, AAB hash, filled checklist, Console screenshots of declarations—not fabricated app UI).
