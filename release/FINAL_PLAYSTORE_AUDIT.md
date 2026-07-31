# FINAL_PLAYSTORE_AUDIT.md

**Role:** Simulated Google Play Policy + Quality Review  
**Date:** 2026-07-30  
**Package:** `com.pocketbrain.app`  
**Version under review:** 1.6.1 / configured `versionCode` 10  
**Verdict:** ❌ **Would not pass first review / cannot approve submission today**

Facts only. Marks: ✅ PASS · ⚠️ WARNING · ❌ FAIL

---

## Store listing

| Item | Mark | Evidence / explanation |
| --- | --- | --- |
| App name | ✅ PASS | `PocketBrain` in `app.json` / listing |
| Short description ≤80 | ✅ PASS | 80 chars in `store/play/LISTING.md`; enforced by test |
| Full description | ⚠️ WARNING | Draft is honest about gates; not entered/verified in Console |
| Feature graphic 1024×500 | ✅ PASS | `assets/play/feature-graphic.png` measured **1024×500** |
| High-res icon 512×512 | ✅ PASS | `assets/play/icon-512.png` measured **512×512** |
| App icon / adaptive | ✅ PASS | `assets/icon.png` 1024×1024; adaptive layers present |
| Phone screenshots (≥2) | ❌ FAIL | `assets/play/screenshots/` contains **only** `README.md` (0 PNGs) |
| Tablet screenshots | ⚠️ WARNING | `supportsTablet: true`; tablet shots not provided |
| Category | ⚠️ WARNING | Documented as Productivity in listing — Console entry not evidenced |
| Tags / ASO keywords | ⚠️ WARNING | Draft only in listing |
| Contact email | ⚠️ WARNING | `support@pocketbrain.app` configured; inbox delivery **not verified** |
| Support URL | ❌ FAIL | `https://pocketbrain.app/support` → 307 → SPA shell (`pocketbrain.chat`), not a support document; draft `store/legal/contact.html` not proven live as policy content |

---

## Legal

| Item | Mark | Evidence / explanation |
| --- | --- | --- |
| Privacy Policy URL configured | ⚠️ WARNING | `app.json` extra → `https://pocketbrain.app/privacy` |
| Privacy Policy URL usable | ❌ FAIL | HTTP fetch: **307** to `https://pocketbrain.chat/privacy` → SPA `index.html` (936 bytes) titled “Pocket Brain - powered by runinbrowser-ai”. **No privacy policy text** in HTML. Loads **Umami** (`cloud.umami.is`). Does **not** match `store/legal/privacy.html`. |
| Terms of Service URL usable | ❌ FAIL | Same redirect/SPA pattern as Privacy — not a readable Terms document |
| Open-source licenses (in-app) | ⚠️ WARNING | Legal screens exist in code; device display **UNVERIFIED** |
| Copyright notices | ⚠️ WARNING | In-app + `LICENSE` (Expo template copyright header still present) |
| Hostable policy drafts | ✅ PASS (repo) | `store/legal/{privacy,terms,faq,contact}.html` exist |

**Play User Data policy:** A Privacy Policy URL must lead to a **clear, accessible privacy policy**. A marketing SPA shell is **insufficient**.

---

## Technical

| Item | Mark | Evidence / explanation |
| --- | --- | --- |
| Signed release AAB | ❌ FAIL | No production AAB artifact found |
| Release signing (non-debug) | ❌ FAIL | `android/app/build.gradle` release `signingConfig signingConfigs.debug`; only `debug.keystore` present |
| Target SDK | ✅ PASS (config) | `expo-build-properties` `targetSdkVersion: 35` |
| Compile SDK | ✅ PASS (config) | `compileSdkVersion: 35` |
| minSdk | ✅ PASS (config) | `minSdkVersion: 26` |
| Manifest permissions (declared) | ✅ PASS (policy intent) | Explicit `INTERNET`, `ACCESS_NETWORK_STATE`; `SYSTEM_ALERT_WINDOW` blocked |
| Plugin-merged sensitive permissions | ⚠️ WARNING | Mic/camera/photos via plugins — justified in docs; runtime UX **UNVERIFIED** |
| Adaptive icons | ✅ PASS | Configured in `app.json` |
| Splash screen | ✅ PASS | Configured (`#0F766E`) |
| Version name | ⚠️ WARNING | Source of truth `1.6.1`; generated Gradle still `1.6.0` |
| Version code | ⚠️ WARNING | `app.json` = 10; generated Gradle = **9** — stale native project |
| `eas.json` production profile | ✅ PASS (config) | `buildType: app-bundle` |
| iOS deployment target | ✅ PASS (config) | `16.4` (not Play; noted for completeness) |

---

## Policy / declarations

| Item | Mark | Evidence / explanation |
| --- | --- | --- |
| Data Safety answers (docs) | ⚠️ WARNING | `release/DATA_SAFETY.md` ready; Console form entry **not evidenced** |
| Advertising declaration (No ads) | ✅ PASS (code) | No ad SDK in dependencies; monetization noop |
| Advertising ID | ✅ PASS (intent) | No ads / no Ad ID usage documented; Console declaration still required |
| AI transparency / honesty in listing | ✅ PASS (draft) | Listing discloses native GGUF need + gated vision/image |
| User data collection claim | ⚠️ WARNING | App claims no backend; Privacy URL site loads third-party Umami analytics script — **brand/trust conflict** if that domain represents the product |
| Runtime permissions | ⚠️ WARNING | Documented; denial paths **UNVERIFIED** on device |
| Sensitive APIs | ⚠️ WARNING | Mic/camera/OCR present; need reviewer notes + device proof |
| Background execution | ⚠️ WARNING | No evidence of abusive background; downloads behavior **UNVERIFIED** |
| Device compatibility matrix | ❌ FAIL | `DEVICE_COMPATIBILITY*` docs exist; **no** hardware results |
| Families / target audience | ⚠️ WARNING | Docs say not Designed for Families — Console must match |

---

## Quality

| Item | Mark | Evidence / explanation |
| --- | --- | --- |
| Crash-free launch | ❌ FAIL | No device install; cannot assert |
| Device testing | ❌ FAIL | `adb devices` empty; all journeys BLOCKED in `FINAL_QA_REPORT.md` |
| Performance | ❌ FAIL | Not profiled on device |
| Accessibility | ❌ FAIL | TalkBack matrix not executed |
| Tablet support | ⚠️ WARNING | Flag enabled; no tablet QA |
| Offline support | ❌ FAIL | Designed in architecture; **UNVERIFIED** after install |

---

## Would this pass Play review?

**No.** Even if a debug-signed build were somehow accepted (it would not be for production), the submission would fail or be delayed on:

1. Missing phone screenshots (production listing)  
2. Privacy/Terms URLs not presenting actual legal documents  
3. Lack of evidence of a stable, crash-tested release binary  
4. Incomplete Console declaration work (Data Safety / Content Rating) not proven done  

**Internal testing track:** Still **not recommended** until non-debug signing + readable Privacy Policy URL + at least one device smoke install of the intended binary.

---

## Live URL observation log (2026-07-30, this audit)

```
https://pocketbrain.app/privacy  → HTTP/2 307 → https://pocketbrain.chat/privacy → 200
  Body: SPA shell; title "Pocket Brain - powered by runinbrowser-ai"
  Includes: https://cloud.umami.is/script.js (analytics)
https://pocketbrain.app/terms    → same pattern
https://pocketbrain.app/support  → same pattern
https://pocketbrain.app          → 200 (site root)
```

Local drafts that **should** be published instead: `store/legal/privacy.html`, `terms.html`, `contact.html`, `faq.html`.
