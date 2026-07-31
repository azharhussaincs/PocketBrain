# FINAL_QA_REPORT.md

**Version:** 1.6.1  
**Session:** 2026-07-30 Final Verification

## Automated QA

| Command | Result |
| --- | --- |
| `npm install` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS (26) |
| `npm run verify:release` | PASS (after README/listing sync) |
| `npx expo prebuild -p android --no-install` | PASS |
| `npx expo export -p android` | PASS (1882 modules → HBC bundle) |
| `npx expo-doctor` | BLOCKED (npm network ECONNRESET) |
| `npx expo run:android` | BLOCKED (no device/emulator) |

## Core user journey matrix

| Journey | Result | Notes |
| --- | --- | --- |
| Splash | **BLOCKED** | No device run |
| Onboarding | **BLOCKED** | Code present (`OnboardingConsentGate`) |
| Home | **BLOCKED** | Code present |
| Marketplace | **BLOCKED** | Code present |
| Download model | **BLOCKED** | DownloadManager implemented |
| Install model | **BLOCKED** | ModelManager implemented |
| Chat | **BLOCKED** | Requires native llama.rn on device for real inference |
| Workspace | **BLOCKED** | Code present |
| Copy response | **BLOCKED** | ResponseActions implemented |
| Export document | **BLOCKED** | Exporters implemented |
| Delete model | **BLOCKED** | Implemented |
| Install another model | **BLOCKED** | Implemented |
| Storage manager | **BLOCKED** | Code present |
| Settings | **BLOCKED** | Code present |

No PASS marks for device journeys — none were executed.

## Known non-fatal runtime warnings (verified logs)

- React Native DevTools / `dotslash` cache permission denied under `~/.cache/dotslash`
- Log line: “Using src/app as the root directory for Expo Router” (project uses React Navigation + `registerRootComponent`, not Expo Router)
- Prebuild advisory: install `expo-system-ui` for `userInterfaceStyle` (npm install blocked by network this session)
