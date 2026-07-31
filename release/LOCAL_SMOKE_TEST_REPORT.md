# Local Smoke Test Report — PocketBrain

**Date:** 2026-07-31  
**Version:** 1.9.3  
**Scope:** Phases 5–6 (screens + functional workflows)

---

## Executive result

**⚠ Could not be verified due to missing external environment**

No Android emulator or physical device was available with a working SDK. Therefore **no UI client** loaded the Metro bundle. Screen and workflow items below were **not** executed.

What **was** executed (non-UI):

| Item | Status | Evidence |
| --- | --- | --- |
| Metro serving Android JS | ✅ | HTTP 200 bundle, 2046 modules |
| Automated unit/integration tests | ✅ | `npm test` — 61 pass |
| Release verify suites | ✅ | `npm run verify:all` |

---

## Phase 5 — Major screens

| Screen | Status | Notes |
| --- | --- | --- |
| Splash | ⚠ Not executed | Requires device/emulator client |
| Onboarding | ⚠ Not executed | |
| Home | ⚠ Not executed | |
| Marketplace | ⚠ Not executed | |
| Downloads | ⚠ Not executed | |
| My Models | ⚠ Not executed | |
| Chat | ⚠ Not executed | |
| Playground | ⚠ Not executed | |
| Workspace | ⚠ Not executed | |
| Files | ⚠ Not executed | |
| Settings | ⚠ Not executed | |
| Legal pages | ⚠ Not executed | In-app; live hosting is a separate external gate |
| About | ⚠ Not executed | |

**None marked ✅ Verified by execution** for on-device rendering.

---

## Phase 6 — Functional smoke workflows

| Workflow | Status |
| --- | --- |
| Open Marketplace | ⚠ Not executed |
| Browse models | ⚠ Not executed |
| Search models | ⚠ Not executed |
| Filter models | ⚠ Not executed |
| Download flow (mock if Expo Go) | ⚠ Not executed |
| Cancel download | ⚠ Not executed |
| Resume download | ⚠ Not executed |
| Delete model | ⚠ Not executed |
| Rename model | ⚠ Not executed |
| Open Chat | ⚠ Not executed |
| Send message | ⚠ Not executed |
| Copy response | ⚠ Not executed |
| Share response | ⚠ Not executed |
| Export document | ⚠ Not executed |
| Open Workspace | ⚠ Not executed |
| Create document | ⚠ Not executed |
| Save | ⚠ Not executed |
| Export PDF | ⚠ Not executed |
| Export DOCX | ⚠ Not executed |
| Navigate back | ⚠ Not executed |
| Restart app / persistence | ⚠ Not executed |

Automated repository tests cover selected offline-policy and config assertions; they are **not** a substitute for the interactive smoke list above.

---

## Blocker (external)

1. `ANDROID_SDK_ROOT` points to `/home/albaloshi/Android/Sdk` but the directory **does not exist**.
2. `adb devices` listed **no** devices.
3. `emulator` binary **not** on `PATH`; AVD config files exist under `~/.android/avd/` but cannot start without SDK tools.

See `DEVICE_EXECUTION_GUIDE.md` for the intended device path once SDK + device are present.
