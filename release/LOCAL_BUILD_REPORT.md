# Local Build Report — PocketBrain

**Date:** 2026-07-31  
**Version:** 1.9.3 / `versionCode` 16

---

## Commands executed

### `npx expo prebuild --platform android --no-install`

| Field | Value |
| --- | --- |
| Status | ✅ Verified by execution |
| Exit | 0 |
| Result | Cleared/created `./android`, finished prebuild |
| Note | `android/` is gitignored (`.gitignore`); regenerate on each machine as README states |
| RN note | CLI: using `react-native@0.86.2` instead of recommended `0.86.0` — install succeeded; not treated as hard fail |

### `npx expo run:android --no-install`

| Field | Value |
| --- | --- |
| Status | ❌ Failed (external environment) |
| Observable errors | `Failed to resolve the Android SDK path. Deprecated ANDROID_SDK_ROOT is set to a non-existing path: /home/albaloshi/Android/Sdk.` |
| Follow-on | `CommandError: No Android connected device found, and no emulators could be started automatically.` |
| App installed on device? | **No** |
| App process launched? | **No** |

---

## Environment probe (this host)

| Probe | Result |
| --- | --- |
| `ANDROID_HOME` | unset |
| `ANDROID_SDK_ROOT` | `/home/albaloshi/Android/Sdk` |
| SDK directory exists | ❌ No |
| `adb` | Present (`/usr/bin/adb`) |
| `adb devices` | Empty list |
| `emulator` on PATH | ❌ No |
| AVD configs under `~/.android/avd/` | Present (`Medium_Phone_API_36.1`) but unusable without SDK |
| Java | `java version "25.0.2"` present |

---

## What this does **not** prove

- Signed release AAB / Play upload (credentials SKIP in `verify:build` — expected)
- Physical-device QA
- Production signing

Those remain external gates documented in `EXTERNAL_DEPENDENCIES.md` and `APP_SIGNING.md`.

---

## Repository vs environment

| Failure | Classification |
| --- | --- |
| Prebuild success | Repository tooling OK |
| Missing SDK path / no device | **External environment limitation** — not a repository defect |
| No code change required for this failure | Correct |

To unblock on a developer machine:

1. Install Android Studio / SDK; set `ANDROID_HOME` to a real SDK root.
2. Start an emulator or connect a device with USB debugging.
3. `npx expo prebuild --platform android`
4. `npx expo run:android` (or `npm run android`)
