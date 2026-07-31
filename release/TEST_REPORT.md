# Test report — Phase 9 (2026-07-30)

## Environment

- App: PocketBrain **1.5.1** (versionCode **8**)
- Host: Linux
- `adb devices`: **none**
- Android SDK: incomplete for emulator/build on this host
- Legal URL check: privacy/terms **404**

## Automated

| Test | Result |
| --- | --- |
| `npm run typecheck` | **PASS** |
| `npm run test` | **PASS** |
| `npm run verify:release` | Run after README/version sync |

## Native / device RC

| Journey | Result |
| --- | --- |
| Signed release AAB | **BLOCKED** |
| Fresh install on device | **BLOCKED** |
| Upgrade install | **BLOCKED** |
| Onboarding | **Code reviewed** |
| Model download | **BLOCKED** on device |
| Chat native GGUF | **BLOCKED** |
| Workspace export | **BLOCKED** |
| Files / Storage | **BLOCKED** on device |
| Offline airplane mode | **BLOCKED** |
| Permission denial | **PARTIAL** (code paths exist) |
| Vision / OCR / Speech | **PARTIAL / gated** |
| Low storage | **BLOCKED** |
| Crash recovery | **BLOCKED** |

## Evidence policy

No PASS claimed for device journeys without hardware proof. No fabricated screenshots attached.
