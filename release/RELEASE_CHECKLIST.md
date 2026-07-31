# Release Checklist — Phase 9

Version **1.5.1** · versionCode **8**

| Item | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | **PASS** | 2026-07-30 Phase 9 |
| `npm run test` | **PASS** | 19+ tests |
| `npm run verify:release` | **PASS** | 2026-07-30 Phase 9 |
| Privacy URL HTTPS 200 | **FAIL** | 404 verified |
| Terms URL HTTPS 200 | **FAIL** | 404 verified |
| Contact page live | **FAIL** | Draft at `store/legal/contact.html` — not published |
| Support email deliverability | **BLOCKED** | Not inbox-tested this session |
| Feature graphic 1024×500 | **PASS** | Verified dimensions |
| Icon 512×512 | **PASS** | Verified dimensions |
| ≥2 phone screenshots | **BLOCKED** | Capture plan only |
| Production signing | **BLOCKED** | See `APP_SIGNING.md` |
| Signed AAB built | **BLOCKED** | No device/SDK path this session |
| Physical device install | **BLOCKED** | `adb devices` empty |
| RC journeys on device | **BLOCKED** | |
| Data Safety form drafted | **PASS (docs)** | `DATA_SAFETY.md` |
| Content rating guidance | **PASS (docs)** | `CONTENT_RATING.md` |
| Reviewer notes drafted | **PASS (docs)** | `REVIEW_NOTES.md` |
| Listing metadata drafted | **PASS (docs)** | `PLAY_STORE_SUBMISSION.md` |

## Gate

All **FAIL/BLOCKED** rows above must become **PASS** before recommending Internal Testing upload.
