# Final External Actions — PocketBrain

**These actions cannot be completed inside git.**  
**Do them in order.** Guides are linked.

---

## 1. Host legal pages (FIRST)

**Why first:** Play Privacy URL + trust; Phase 16 found SPA shell at configured URLs.

1. Deploy `store/legal/*.html` as **static** HTML (see `LEGAL_DEPLOYMENT_GUIDE.md`).  
2. Remove redirects to marketing SPA.  
3. Verify:

```bash
curl -sL https://pocketbrain.app/privacy | head -n 40
curl -sL https://pocketbrain.app/terms | head -n 40
```

**Pass:** Policy/Terms body text visible without JS.

---

## 2. Provide signing credentials

- EAS: `eas credentials` + `eas build -p android --profile production`  
- Or local: keystore + `PB_UPLOAD_*` / `keystore.properties`  
- See `SIGNING_EXECUTION_GUIDE.md`  
- **Never commit secrets**

---

## 3. Build signed AAB

```bash
# After credentials:
eas build -p android --profile production
# or local bundleRelease per APP_SIGNING.md
```

Confirm version **1.0.0** / versionCode **17** (or bump intentionally for a new upload).

---

## 4. Connect physical Android device

Run P0 matrix in `DEVICE_EXECUTION_GUIDE.md` on API 26+ hardware with the signed/native build.

---

## 5. Capture real screenshots

≥2 phone PNGs per `SCREENSHOT_PRODUCTION_GUIDE.md`.  
**Do not** fabricate images.

---

## 6. Upload to Google Play

Follow `PLAY_CONSOLE_EXECUTION_GUIDE.md` → Internal testing (`INTERNAL_TESTING_PLAN.md`).

Checklist: `FINAL_PLAYSTORE_UPLOAD_CHECKLIST.md`.

---

## Exact remaining list (operator)

- [ ] Legal static hosting verified  
- [ ] Signing credentials created & backed up  
- [ ] Signed AAB produced  
- [ ] Play App Signing enrolled  
- [ ] Device P0 PASS  
- [ ] Screenshots captured  
- [ ] Data Safety / Content Rating / ads / audience filled  
- [ ] Internal testing release live  
- [ ] Testers installed  

Nothing else is required from the **repository codebase** to begin this list.
