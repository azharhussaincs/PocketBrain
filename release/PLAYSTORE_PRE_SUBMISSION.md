# Play Store Pre-Submission Package — PocketBrain

**App:** PocketBrain · `com.pocketbrain.app`  
**Marketing version:** **1.9.3** · **versionCode:** **16**  
**Phase:** 16 (independent production audit) — index still useful; treat Phase 16 gate reports as authoritative for readiness.  

Use this as the single index before opening Play Console.  
**Do not** mark Console items done unless you personally completed them.

---

## A. Repository artifacts (in-tree)

| Item | Path | Repo status |
| --- | --- | --- |
| Store listing copy | `store/play/LISTING.md` | Ready (draft) |
| Release notes | `store/play/RELEASE_NOTES.md` | Ready |
| Feature graphic | `assets/play/feature-graphic.png` | Ready (1024×500) |
| High-res icon | `assets/play/icon-512.png` | Ready (512×512) |
| App / adaptive icons | `assets/` + brand | Ready |
| Phone screenshots | `assets/play/screenshots/` | **Pending capture** |
| Screenshot guide | `release/SCREENSHOT_CAPTURE_GUIDE.md` | Ready |
| Privacy / Terms / Contact / AI / Licenses HTML | `store/legal/` | Ready (static) |
| Hosting instructions | `store/legal/HOSTING.md` | Ready |
| Data Safety mapping | `release/DATA_SAFETY.md` | Ready (docs) |
| Content Rating guidance | `release/CONTENT_RATING.md` | Ready (docs) |
| Permissions | `release/PERMISSIONS.md` | Ready |
| Open-source inventory | `release/OPEN_SOURCE_LICENSE_INVENTORY.md` | Ready |
| Licenses HTML | `store/legal/licenses.html` | Ready |
| Reviewer notes | `release/REVIEW_NOTES.md` | Ready |
| Device compatibility | `release/DEVICE_COMPATIBILITY.md` | Ready (docs) |
| Known limitations | `release/KNOWN_LIMITATIONS.md` | Ready |
| App signing | `release/APP_SIGNING.md` | Ready (credentials external) |
| Device QA checklist | `release/DEVICE_QA_CHECKLIST.md` | Ready (blank results) |
| Hardware plan | `release/HARDWARE_VERIFICATION_PLAN.md` | Ready |
| EAS profiles | `eas.json` | Ready |

---

## B. External actions (not done in-repo)

| Action | Owner | Done? |
| --- | --- | --- |
| Publish static legal HTML at declared URLs | Operator | [ ] |
| Create upload keystore or EAS credentials | Operator | [ ] |
| Produce signed production AAB | Operator | [ ] |
| Enroll Play App Signing | Operator | [ ] |
| Physical device RC (`DEVICE_QA_CHECKLIST.md`) | QA | [ ] |
| Capture ≥2 real screenshots | QA | [ ] |
| Play Console listing entry | Operator | [ ] |
| Data Safety form in Console | Operator | [ ] |
| Content Rating questionnaire | Operator | [ ] |
| Ads / Ad ID declarations | Operator | [ ] |
| Internal testing upload | Operator | [ ] |
| Verify support inbox receives mail | Operator | [ ] |

---

## C. Console field mapping

| Console field | Source |
| --- | --- |
| App name | PocketBrain |
| Short description | `store/play/LISTING.md` |
| Full description | `store/play/LISTING.md` |
| Category | Productivity |
| Contact email | `support@pocketbrain.app` |
| Privacy Policy URL | `https://pocketbrain.app/privacy` (**must serve static policy**) |
| Terms | `https://pocketbrain.app/terms` |
| Release notes | `store/play/RELEASE_NOTES.md` |
| Review notes | `release/REVIEW_NOTES.md` |

---

## D. Pre-upload gate (all must be true)

1. [ ] Legal URLs: `curl -sL` shows Privacy/Terms **body text** (not SPA shell)  
2. [ ] AAB signed with **non-debug** upload key  
3. [ ] Device QA critical journeys PASS  
4. [ ] ≥2 real screenshots uploaded to Console  
5. [ ] Data Safety matches `DATA_SAFETY.md`  
6. [ ] No ads / no Ad ID declared as applicable  
7. [ ] `versionName` / `versionCode` match this document (1.9.3 / 16)

If any box is unchecked → **do not** submit to Production. Internal testing requires at least (1)–(3).


Also see `EXTERNAL_DEPENDENCIES.md` and Phase 16 `RELEASE_GATE_REPORT.md`.

**Marketing version / versionCode:** **1.9.3** / **16**
