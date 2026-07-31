# Signing Execution Guide — Phase 18

**Rule:** Never commit keystores, passwords, or `keystore.properties`.  
**Rule:** Never generate secrets inside this chat or commit them to git.  
**Repo baseline:** Fail-closed release signing via `plugins/withAndroidReleaseSigning.js` (see `APP_SIGNING.md`).

**App version for next binary:** **1.9.3** / `versionCode` **16** (bump only when you intentionally ship a new store binary).

---

## Path A — EAS Build (recommended)

### Objective

Produce a Play-ready AAB without storing the upload keystore in git.

### Prerequisites

- Expo account with access to this project  
- `eas-cli` installed  
- `eas.json` production profile (`app-bundle`) — already in repo  

### Steps

1. `npm ci`  
2. `npm run lint && npm test && npm run verify:all`  
3. `eas login`  
4. `eas credentials` → Android → production → create or select upload keystore (Expo-managed).  
5. `eas build -p android --profile production`  
6. Download the AAB from the EAS build page.  
7. Back up Expo credential recovery materials per Expo docs (org process).

### Success criteria

- Build succeeds  
- Artifact is `.aab`  
- Play Console accepts upload (after App Signing enrollment)  
- `verify:build` would no longer SKIP credentials only if local env is also set — EAS path does not require local `PB_UPLOAD_*`

### Common mistakes

- Using `development` / `preview` APK profile for Play Production/Internal AAB requirement  
- Committing `.jks` or env files  
- Changing `applicationId` away from `com.pocketbrain.app`

---

## Path B — Local Gradle upload keystore

### 1. Generate keystore (operator machine only)

```bash
mkdir -p credentials
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore credentials/pocketbrain-upload.jks \
  -alias pocketbrain-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store passwords in a password manager. Add offline encrypted backup.

### 2. Configure credentials (pick one)

**Env vars:**

```bash
export PB_UPLOAD_STORE_FILE="$PWD/credentials/pocketbrain-upload.jks"
export PB_UPLOAD_STORE_PASSWORD='…'
export PB_UPLOAD_KEY_ALIAS='pocketbrain-upload'
export PB_UPLOAD_KEY_PASSWORD='…'
```

**Or** `android/keystore.properties` from `credentials/keystore.properties.example` (gitignored).

### 3. Build

```bash
npx expo prebuild --platform android
cd android
./gradlew bundleRelease
# android/app/build/outputs/bundle/release/app-release.aab
```

### Success criteria

- Release build does **not** use debug signing  
- Without credentials, release build **fails** (fail-closed) — expected  
- With credentials, AAB produced  

### Verify signing (operator)

```bash
jarsigner -verify -verbose -certs app-release.aab
# or apksigner / bundletool as available in your SDK
```

Confirm certificate is **not** the Android debug certificate.

---

## Play App Signing

1. Play Console → App → Setup → App signing.  
2. Upload first AAB using the upload key.  
3. Google may re-sign with the app signing key.  
4. Keep the **upload** key backed up; enroll correctly so updates remain possible.

---

## Backup strategy

| Secret | Backup |
| --- | --- |
| Upload keystore `.jks` / `.keystore` | Encrypted offline + second geographic copy |
| Passwords / aliases | Password manager; printed sealed copy optional |
| EAS credentials | Org admin recovery; document who has access |
| Play Console owner | 2FA; account recovery contacts |

**Losing the upload key without Play App Signing recovery paths can permanently block updates.**

---

## Security checklist

- [ ] Nothing sensitive in git (`git status` clean of keystores)  
- [ ] CI secrets injected via vault/EAS, not plaintext in scripts committed to repo  
- [ ] Debug keystore never used for Play upload  
- [ ] Operator recorded key creation date and custodian (outside this repo)
