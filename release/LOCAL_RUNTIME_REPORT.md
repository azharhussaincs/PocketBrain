# Local Runtime Report — PocketBrain

**Date:** 2026-07-31  
**Version:** 1.9.3 / Android `versionCode` 16  
**Host:** Linux 6.8.0-136-generic  
**Evidence standard:** Commands executed in this session only. No fabricated UI, device, or screenshot claims.

---

## Verdict

| Layer | Status |
| --- | --- |
| Dependencies (`npm install`) | ✅ Verified by execution |
| Static verification (`lint` / `typecheck` / `test` / `verify:all`) | ✅ Verified by execution |
| Metro bundler | ✅ Verified by execution |
| Android JS bundle (HTTP from Metro) | ✅ Verified by execution |
| Native app on emulator/device | ⚠ Could not be verified — external environment |
| Interactive screen / smoke UI | ⚠ Could not be verified — no running client |

**Certification posture:** Repository Complete, but full local app runtime blocked by external Android SDK / device environment.

---

## Phase 1 — Fresh environment

| Check | Result | Evidence |
| --- | --- | --- |
| `npm install` | ✅ exit 0 | Completed; lockfile-resolved install; `npm ls --depth=0` lists expected Expo 57 / RN 0.86 tree |
| Missing packages | ✅ None observed | Install and later Metro resolve succeeded (2046 modules) |
| Peer / conflict hard fail | ✅ None | No `ERESOLVE` failure; install exit 0 |
| `npm audit` advisories | ⚠ Informational | Reported 13 vulnerabilities (12 moderate, 1 high) — did not block install or Metro |

---

## Phase 2 — Project verification

| Command | Exit | Status |
| --- | --- | --- |
| `npm run lint` | 0 | ✅ (`tsc --noEmit`) |
| `npm run typecheck` | 0 | ✅ (`tsc --noEmit`) |
| `npm test` | 0 | ✅ 61 passed, 0 failed |
| `npm run verify:all` | 0 | ✅ ALL SUITES PASSED (WARN screenshots; SKIP credentials — expected external) |
| `npx expo-doctor` | 0* | ⚠ 19/20 — schema check flags `newArchEnabled` and top-level `splash` |

\*Doctor reported one failed check but process exit was 0. Fields remain valid Expo app config practice for this project (splash also configured via `expo-splash-screen` plugin). **Not treated as a repository defect** — tooling schema lag vs SDK 57 config in use. Removing them would be harmful without docs-backed replacement.

---

## Phase 3 — Metro

| Check | Status | Evidence |
| --- | --- | --- |
| `CI=1 npx expo start --port 8081` | ✅ | Log: `Starting Metro Bundler` → `Waiting on http://localhost:8081` |
| Packager status | ✅ | `curl http://127.0.0.1:8081/status` → `packager-status:running` |
| Android bundle | ✅ | `GET …/index.bundle?platform=android&dev=true&minify=false` → HTTP **200**, **15 800 071** bytes; Metro log: `Android Bundled 32685ms index.ts (2046 modules)` |
| Bundle integrity (basic) | ✅ | Starts with `__BUNDLE_START_TIME__`; ends with `sourceMappingURL` / `sourceURL` for android index |
| QR code in terminal | ⚠ | CI mode disables interactive watch UI; QR not asserted in this run |
| Fatal Metro / resolve errors | ✅ None | Bundle served; no Unable-to-resolve failure at request time |
| Known non-fatal note | ⚠ | CLI message `Using src/app as the root directory for Expo Router` — **false positive** (app uses classic React Navigation; documented elsewhere) |

---

## Phase 4–7 — Device / UI / performance

| Area | Status |
| --- | --- |
| `npx expo prebuild --platform android --no-install` | ✅ Finished prebuild; `android/` generated (gitignored) |
| `npx expo run:android` | ❌ Failed (external) — see `LOCAL_BUILD_REPORT.md` |
| Screen navigation | ⚠ Not executed — no client |
| Functional smoke workflows | ⚠ Not executed — no client |
| Startup / memory / red screen | ⚠ Not observable without device |

---

## Runtime errors found (this session)

| Issue | Repo-controlled? | Action |
| --- | --- | --- |
| Missing Android SDK directory at `ANDROID_SDK_ROOT=/home/albaloshi/Android/Sdk` | No — host env | Document only |
| No `adb` devices; emulator binary unavailable | No — host env | Document only |
| expo-doctor schema complaints | Tooling / schema | No config strip |
| `NO_COLOR` / `FORCE_COLOR` Node warnings during bundle | Env noise | Ignored |

No repository code fix was required to make Metro serve an Android bundle.

---

## Related artifacts

- `LOCAL_SMOKE_TEST_REPORT.md`
- `LOCAL_BUILD_REPORT.md`
- `LOCAL_RUNTIME_ERRORS.md`
- `LOCAL_EXECUTION_CERTIFICATE.md`
