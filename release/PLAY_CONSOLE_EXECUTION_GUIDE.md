# Play Console Execution Guide — Phase 18

**Package:** `com.pocketbrain.app`  
**Version to upload:** **1.9.3** (`versionCode` **16**) unless you bump for a new binary  
**Chronological workflow** for a new Android app → Internal testing.

Mark each page complete only after real Console actions.

---

## 0. Before Console

- [ ] E1 legal URLs pass `curl -sL` body check (`LEGAL_DEPLOYMENT_GUIDE.md`)  
- [ ] Signed AAB ready (`SIGNING_EXECUTION_GUIDE.md`)  
- [ ] P0 device smoke PASS (`DEVICE_EXECUTION_GUIDE.md`)  
- [ ] Drafts open: `store/play/LISTING.md`, `RELEASE_NOTES.md`, `DATA_SAFETY.md`, `CONTENT_RATING.md`, `PERMISSIONS.md`, `REVIEW_NOTES.md`

---

## 1. Create app

| Field | Source | Notes |
| --- | --- | --- |
| App name | PocketBrain | Must match branding |
| Default language | English (US) or EN | |
| App/Game | App | |
| Free/Paid | Free | |

**Mistake:** Creating a second app with a different package later.

---

## 2. Dashboard → Setup essentials

Complete warnings until store listing + package + signing basics are unblocked.

---

## 3. App integrity / Play App Signing

| Action | Notes |
| --- | --- |
| Enroll Play App Signing | First AAB upload typically enrolls |
| Upload key | From EAS or local keystore |

**Validate:** Signing page shows app signing certificate + upload key.

---

## 4. Package name

Confirm `com.pocketbrain.app` — must match `app.json` / Gradle. **Immutable** after first upload.

---

## 5. Store listing (main)

| Field | Repository source | Manual? |
| --- | --- | --- |
| Short description | `LISTING.md` (≤80 chars) | Paste |
| Full description | `LISTING.md` | Paste; keep honesty bullets |
| App icon 512 | `assets/play/icon-512.png` | Upload |
| Feature graphic | `assets/play/feature-graphic.png` | Upload |
| Phone screenshots | Real captures only | Upload ≥2 for Production; Internal may allow fewer depending on Console prompts |
| Category | Productivity | Select |
| Contact email | `support@pocketbrain.app` | Verify mailbox (E12) |
| Privacy policy URL | `https://pocketbrain.app/privacy` | Must be live static HTML |
| App website | Optional | Don’t point to wrong SPA |

**Common mistakes:** Privacy URL = SPA; overclaiming Vision; fabricated screenshots.

**Validate:** Preview listing; open Privacy URL from Console.

---

## 6. Store settings / graphics extras

Tablet screenshots optional. Keep phone set complete for Production.

---

## 7. Data safety

| Console section | Source |
| --- | --- |
| Collect/share data | `DATA_SAFETY.md` → **No** developer collection via backend |
| On-device processing | Yes for chats/docs/models/media user chooses |
| Encryption / deletion | Follow draft; be truthful |
| Account creation | No |

**Mistake:** Declaring analytics you don’t ship — or omitting that users may export/share via system sheet.

---

## 8. Content rating

Complete IARC questionnaire using `CONTENT_RATING.md` guidance.  
**Mistake:** Selecting social UGC features the app doesn’t have.

---

## 9. Target audience & content

| Topic | Guidance |
| --- | --- |
| Target age | Adults / general productivity — be accurate |
| News / COVID / etc. | No unless true |
| Government / finance / health | Not a regulated advisor — don’t claim |

---

## 10. Ads

Declare **No ads**. No Ad ID dependency at launch.

---

## 11. App access / login

No login required. If Console asks for login credentials for review, state not applicable.

---

## 12. Ads & monetization / financial features

None at launch. Align with listing.

---

## 13. Government apps / COVID / news

Answer **No** unless that changes (it has not in-repo).

---

## 14. Privacy policy (declarations)

Reconfirm URL. Must match hosted static HTML.

---

## 15. App content → AI disclosure (as Console presents)

Disclose on-device generative AI; outputs may be inaccurate; see in-app AI disclaimer.  
Do **not** claim full multimodal Vision.

Source: `store/legal/ai-disclaimer.html`, `REVIEW_NOTES.md`.

---

## 16. Release → Testing → Internal testing

| Step | Action |
| --- | --- |
| Create release | Upload AAB 1.9.3 (16) |
| Release notes | From `store/play/RELEASE_NOTES.md` |
| Review | Address Console errors (signing, listing, declarations) |
| Roll out to Internal | Start rollout |
| Testers | Email lists or Google Groups |
| Share link | Testers opt in |

Details: `INTERNAL_TESTING_PLAN.md`.

---

## 17. Post-upload validation

- [ ] Testers see the build  
- [ ] Install works on physical device via Play  
- [ ] Crashlytics/not applicable — no crash SDK; use Play Vitals  
- [ ] Monitor ANRs / crashes in Play Console  

---

## Chronological page order (summary)

1. Create app  
2. App signing  
3. Main store listing + graphics  
4. Privacy policy URL  
5. Data safety  
6. Content rating  
7. Audience / ads / app content / AI disclosures  
8. Internal testing release + testers  
9. (Later) Closed → Open → Production per `PRODUCTION_ROLLOUT_PLAN.md`

---

## Stop

Do **not** advance to Production from this guide alone. Use staged rollout plan after Internal/Closed confidence.
