# FINAL_RELEASE_CHECKLIST.md

## Gate: all must be PASS before Production

| # | Item | Status |
| --- | --- | --- |
| 1 | `npm run lint` | **PASS** |
| 2 | `npm run typecheck` | **PASS** |
| 3 | `npm test` | **PASS** |
| 4 | `npm run verify:release` | **PASS** |
| 5 | `npx expo prebuild -p android` | **PASS** |
| 6 | Android JS export / Metro transform | **PASS** (`expo export`) |
| 7 | Privacy URL HTTPS 200 | **FAIL** (404) |
| 8 | Terms URL HTTPS 200 | **FAIL** (404) |
| 9 | Production signing (non-debug) | **FAIL** |
| 10 | Signed AAB produced | **FAIL** |
| 11 | Install on physical Android device | **FAIL** / BLOCKED |
| 12 | Core journeys PASS on device | **FAIL** / BLOCKED |
| 13 | ≥2 real screenshots | **FAIL** |
| 14 | Data Safety form entered in Console | Pending human |
| 15 | Content rating completed in Console | Pending human |

## Blockers

### Critical

| Description | Impact | File / location | Est. fix |
| --- | --- | --- | --- |
| Privacy/Terms URLs return 404 | Play rejects / policy failure | Host `store/legal/*.html` to pocketbrain.app | 1–4 h (hosting) |
| Release signing credentials missing (fail-closed) | Cannot produce signed AAB until credentials | `APP_SIGNING.md` + EAS / `PB_UPLOAD_*` | 2–6 h |
| No device QA / no signed install | Unknown crashes & inference failures | Local SDK + hardware | 1–2 d |
| Missing real screenshots | Listing incomplete | `assets/play/screenshots/` | 2–4 h after device |

### High

| Description | Impact | File / location | Est. fix |
| --- | --- | --- | --- |
| Incomplete Android SDK / no emulator | Cannot `run:android` here | Host `/usr/lib/android-sdk` | 2–8 h setup |
| GGUF inference unverified | Store claims risk | `llama.rn` native build on device | 4–8 h |
| `expo-doctor` not runnable (network) | Unknown dependency health | npm registry access | 0.5 h |

### Medium

| Description | Impact | File / location | Est. fix |
| --- | --- | --- | --- |
| Dense 8-tab navigation | UX on small phones | `RootNavigator.tsx` | 4–12 h redesign |
| Missing `expo-system-ui` (prebuild warning) | `userInterfaceStyle` incomplete | `app.json` plugins | 0.5 h (needs npm) |
| Expo Router false detection of `src/app` | Confusing logs | folder naming / config | 1–3 h |
| DevTools cache permission noise | Non-blocking | `~/.cache/dotslash` | env fix |

### Low

| Description | Impact | File / location | Est. fix |
| --- | --- | --- | --- |
| English-only UI | Localization | `src/i18n` | Later |
| Brand SVG can be further polished | Marketing finish | `assets/brand` | Optional |

### Future

- RAG, plugins, workflows, optional sync/ads, video generation, full multimodal vision/diffusion

## Final choice (only one)

❌ **NOT READY**
