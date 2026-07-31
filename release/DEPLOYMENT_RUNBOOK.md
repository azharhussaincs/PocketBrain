# Deployment Runbook — PocketBrain

**Audience:** Any engineer with no prior project knowledge.  
**Version target:** **1.9.3** / Android `versionCode` **16**  
**Rule:** Do not skip verification. Do not fabricate screenshots, device results, or live URLs.

Related: `APP_SIGNING.md`, `EXTERNAL_DEPENDENCIES.md`, `DEVICE_QA_CHECKLIST.md`, `PLAYSTORE_SUBMISSION_GUIDE.md`.

---

## 0. Prerequisites

| Need | Notes |
| --- | --- |
| Node.js LTS | For `npm install` / Expo |
| Git | Clone repository |
| Expo account (recommended) | For EAS Build |
| Google Play Developer account | For Console upload |
| Domain + static host | For Privacy/Terms |
| Physical Android device API 26+ | For QA / screenshots |
| Optional: Android Studio SDK | Only if building locally instead of EAS |

---

## 1. Fresh clone → install

```bash
git clone <YOUR_REPOSITORY_URL> PocketBrain
cd PocketBrain
npm install
npm run lint
npm test
npm run verify:all
```

**Expect:** `verify:all` exit **0**. `verify:build` may **SKIP** without credentials. Screenshot/legal hosting may **WARN**.

---

## 2. Configure signing (pick one path)

### Path A — EAS (recommended)

```bash
npm install -g eas-cli
eas login
eas credentials   # create Android production credentials
```

See `release/APP_SIGNING.md`.

### Path B — Local keystore

```bash
mkdir -p credentials
keytool -genkeypair -v -storetype PKCS12 \
  -keystore credentials/pocketbrain-upload.jks \
  -alias pocketbrain-upload -keyalg RSA -keysize 2048 -validity 10000

npx expo prebuild --platform android
cp credentials/keystore.properties.example android/keystore.properties
# edit passwords

export PB_UPLOAD_STORE_FILE="$PWD/credentials/pocketbrain-upload.jks"
export PB_UPLOAD_STORE_PASSWORD='…'
export PB_UPLOAD_KEY_ALIAS='pocketbrain-upload'
export PB_UPLOAD_KEY_PASSWORD='…'
```

**Never commit** keystores or `keystore.properties`.

---

## 3. Build production AAB

### EAS

```bash
eas build -p android --profile production
# Download the .aab from the Expo build page
```

### Local

```bash
npx expo prebuild --platform android
cd android && ./gradlew :app:bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Confirm with:

```bash
npm run verify:android
npm run verify:build   # should PASS when credentials exist
```

---

## 4. Host legal pages (before Console Privacy URL)

1. Deploy `store/legal/*.html` per `store/legal/HOSTING.md`.  
2. Ensure `https://pocketbrain.app/privacy` and `/terms` show **policy body text** (not a marketing SPA).  
3. Verify:

```bash
curl -sL https://pocketbrain.app/privacy | head -n 40
```

---

## 5. Install on device & QA

```bash
# Example: install a preview/dev APK or sideload from bundletool
adb devices
# Install your RC binary (EAS APK/AAB→APK or expo run:android for smoke)
```

Execute **P0** rows in `release/DEVICE_QA_CHECKLIST.md`.  
Record Actual / P/F / Notes. **Do not invent PASS.**

Hardware details: `HARDWARE_VERIFICATION_PLAN.md`.

---

## 6. Capture screenshots

Only after UI smoke works:

1. Follow `SCREENSHOT_CAPTURE_GUIDE.md`.  
2. Save real PNGs to `assets/play/screenshots/` with names like `01_home_light.png`.  
3. Re-run `npm run verify:assets` / `verify:playstore` (screenshot WARN should clear when ≥2 PNGs exist).

---

## 7. Play Console

Follow `PLAYSTORE_SUBMISSION_GUIDE.md` in order:

1. Create app  
2. Listing + graphics + screenshots  
3. Privacy Policy URL (live)  
4. Ads = No; Data Safety from `DATA_SAFETY.md`; Content Rating  
5. App Signing  
6. Upload AAB → **Internal testing**  
7. Closed → Production only after Internal stability  

Paste reviewer notes from `REVIEW_NOTES.md`.

---

## 8. Submit & monitor

1. Submit Internal / Closed / Production as appropriate.  
2. Monitor Play Vitals (crashes/ANRs).  
3. Respond to policy questions with honest offline-first answers.  
4. **Approval is never guaranteed.**

---

## 9. Pipeline diagram (source → Play)

```
git clone
   → npm install
   → npm run verify:all
   → signing (EAS or PB_UPLOAD_*)
   → eas build --profile production  OR  gradle bundleRelease
   → signed AAB
   → device install + DEVICE_QA_CHECKLIST
   → screenshots
   → host store/legal HTML
   → Play Console declarations + upload
   → Internal → Closed → Production (staged)
```

---

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `verify:build` SKIP | Expected without credentials |
| Release GradleException missing creds | Set `PB_UPLOAD_*` or use EAS |
| Privacy URL rejected | Deploy static HTML; remove SPA redirect |
| GGUF fails on device | Confirm native build (not Expo Go); see hardware plan |
| `verify:all` FAIL | Fix repository defects; do not upload |

---

## Freeze note

After Deployment RC freeze (see `FINAL_RELEASE_DECISION.md`), only allow bug fixes, legal URL/hosting updates, screenshots, signing artifacts (local), and Console-driven metadata sync — not new AI features.
