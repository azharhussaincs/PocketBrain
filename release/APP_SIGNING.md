# App signing — PocketBrain (Phase 11)

**Rule:** Never commit keystore passwords, keystores, or `keystore.properties`.  
**Rule:** Never upload a debug-signed AAB to Google Play.

---

## Current repository state (Phase 11 verified)

| Item | Status |
| --- | --- |
| Expo config plugin | `plugins/withAndroidReleaseSigning.js` registered in `app.json` |
| Prebuild rewrite | **Verified** — `npx expo prebuild -p android` injects `signingConfigs.release` + fail-closed release buildType |
| Debug-as-release default | **Removed** (release throws without credentials) |
| Upload keystore in repo | **Absent** (correct) |
| Signed production AAB | **Not produced** — supply credentials then EAS/local `bundleRelease` |

---

## Recommended path: EAS Build (Expo SDK 57)

EAS manages the upload keystore in Expo’s credential store (not in git).

```bash
npm install -g eas-cli
eas login
eas credentials   # create / assign Android credentials for production
eas build -p android --profile production
```

`eas.json` production profile builds an **Android App Bundle** (`app-bundle`).

After the first successful production build:

1. Enroll in **Play App Signing** in Play Console.
2. Upload the AAB to **Internal testing** only after Privacy/Terms URLs serve readable static HTML.

---

## Local Gradle path (optional)

### 1. Create an upload keystore

```bash
mkdir -p credentials
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore credentials/pocketbrain-upload.jks \
  -alias pocketbrain-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Back up the keystore and passwords offline. Losing them blocks updates if you are not using Play App Signing correctly.

### 2. Provide credentials (pick one)

**Option A — environment variables**

```bash
export PB_UPLOAD_STORE_FILE="$PWD/credentials/pocketbrain-upload.jks"
export PB_UPLOAD_STORE_PASSWORD='…'
export PB_UPLOAD_KEY_ALIAS='pocketbrain-upload'
export PB_UPLOAD_KEY_PASSWORD='…'
```

**Option B — properties file (gitignored)**

```bash
npx expo prebuild --platform android
cp credentials/keystore.properties.example android/keystore.properties
# edit android/keystore.properties with real values
```

### 3. Prebuild + bundle

```bash
npx expo prebuild --platform android
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

If credentials are missing, **release configuration throws** instead of signing with debug.

### 4. APK (optional, not for Play production)

```bash
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## Environment variables reference

| Variable | Purpose |
| --- | --- |
| `PB_UPLOAD_STORE_FILE` | Path to `.jks` / `.keystore` |
| `PB_UPLOAD_STORE_PASSWORD` | Keystore password |
| `PB_UPLOAD_KEY_ALIAS` | Key alias |
| `PB_UPLOAD_KEY_PASSWORD` | Key password |

---

## Verification checklist

- [ ] Upload keystore created and backed up offline **or** EAS credentials configured
- [ ] `npx expo prebuild -p android` applied; `android/app/build.gradle` contains `PocketBrain release signing (Phase 11)`
- [ ] Release build does **not** use `signingConfigs.debug`
- [ ] `bundleRelease` / EAS production build succeeds
- [ ] `jarsigner -verify -verbose -certs app-release.aab` (or Play Console App integrity) confirms non-debug cert
- [ ] Play Console → App signing enrolled
- [ ] First AAB uploaded to Internal testing only after legal URLs are valid static pages

---

## What this repository cannot do for you

1. Create or store your real upload keystore.  
2. Run EAS cloud builds without your Expo account.  
3. Enroll Play App Signing in your Play Console.  

Once credentials exist, the project is **technically ready** to produce a production-signed AAB.
