# Local Runtime Errors — PocketBrain

**Date:** 2026-07-31  
**Session:** Final Local Execution & Runtime Validation

---

## Legend

- ✅ Verified by execution (observed)
- ⚠ Environment / tooling / not UI-verified
- ❌ Failed command or hard blocker

---

## Errors and warnings observed

### 1. Android SDK path missing — ❌ / external

```
Failed to resolve the Android SDK path. Deprecated ANDROID_SDK_ROOT is set to a
non-existing path: /home/albaloshi/Android/Sdk. Use ANDROID_HOME instead.
CommandError: No Android connected device found, and no emulators could be
started automatically.
```

| Attribute | Value |
| --- | --- |
| Source | `npx expo run:android --no-install` |
| Repository-controlled? | **No** |
| Fixed in repo? | N/A — host must install SDK and connect device/emulator |
| Blocks | Native install, UI smoke, Phase 5–7 |

---

### 2. expo-doctor config schema — ⚠ tooling

```
✖ Check Expo config (app.json / app.config.js) schema
should NOT have additional property 'newArchEnabled'.
should NOT have additional property 'splash'.
```

| Attribute | Value |
| --- | --- |
| Source | `npx expo-doctor` (19/20) |
| Repository-controlled defect? | **Not treated as such** — config matches project Expo 57 usage; splash also via plugin |
| Fixed? | **No** — stripping would risk splash / New Architecture settings without benefit |
| Blocks | Install / Metro / verify:all? **No** |

---

### 3. Expo Router root message — ⚠ false positive

```
Using src/app as the root directory for Expo Router.
```

| Attribute | Value |
| --- | --- |
| Source | `expo start` log |
| Impact | Cosmetic / misleading; app uses React Navigation |
| Fixed? | No code change this session (known; not a runtime crash) |

---

### 4. Node FORCE_COLOR / NO_COLOR warnings — ⚠ noise

Repeated during Android bundle workers:

```
Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
```

| Attribute | Value |
| --- | --- |
| Impact | None on bundle success |
| Fixed? | No |

---

### 5. Metro DevTools / cache permission (earlier attempt) — ⚠ environment

Prior sandboxed start observed DevTools/dotslash cache permission noise with fallback. Restart with unrestricted permissions: Metro ran and served bundle successfully.

| Attribute | Value |
| --- | --- |
| Repository defect? | No |
| Blocks final Metro proof? | No (later run succeeded) |

---

## Errors **not** observed

| Claim | Status |
| --- | --- |
| Missing JS module at bundle time | ✅ Not observed (HTTP 200, full bundle) |
| Metro fatal exception preventing listen | ✅ Not observed |
| Red screen / React Native fatal on device | ⚠ Could not observe (no client) |
| Lint / typecheck / test failures | ✅ None (exit 0) |
| `verify:all` FAIL | ✅ None |

---

## Fixes applied this session

**None.** All hard blockers were external. No repository-controlled runtime defect required a code change to complete Metro + verification.
