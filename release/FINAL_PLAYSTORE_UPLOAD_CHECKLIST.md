# Final Play Store Upload Checklist

**Package:** `com.pocketbrain.app`  
**Binary expected:** **1.9.3** (`versionCode` **16**) unless you intentionally ship a newer build  
**Track target:** Internal testing first

Check only after real-world completion.

---

## Before upload

### Legal & support

- [ ] Privacy URL serves static PocketBrain policy HTML  
- [ ] Terms URL serves static terms HTML  
- [ ] Contact / AI disclaimer / licenses reachable (recommended)  
- [ ] `support@pocketbrain.app` receives mail  

### Binary

- [ ] Signed AAB (not debug)  
- [ ] versionName / versionCode match Play release form  
- [ ] Play App Signing enrolled  

### Device

- [ ] P0 device smoke PASS (`DEVICE_EXECUTION_GUIDE.md`)  

### Listing assets (repo-ready vs external)

| Asset | Repo | Upload |
| --- | --- | --- |
| Short description | `LISTING.md` ✅ | [ ] Paste |
| Full description | `LISTING.md` ✅ | [ ] Paste |
| Icon 512 | `assets/play/icon-512.png` ✅ | [ ] Upload |
| Feature graphic | `assets/play/feature-graphic.png` ✅ | [ ] Upload |
| Phone screenshots | ⚠ external | [ ] ≥2 real PNGs |
| Privacy policy URL | configured; ⚠ must be live correct | [ ] Set & open-test |

### Declarations

- [ ] Data Safety (`DATA_SAFETY.md`)  
- [ ] Content Rating (`CONTENT_RATING.md`)  
- [ ] No ads  
- [ ] Target audience  
- [ ] AI / generative disclosure — Limited Vision honest  

### Release

- [ ] Internal testing track selected  
- [ ] Release notes from `store/play/RELEASE_NOTES.md`  
- [ ] AAB uploaded  
- [ ] Rollout started  
- [ ] Testers invited  

---

## Do not upload if

- Privacy URL is still a SPA shell  
- AAB is debug-signed  
- You have zero device smoke confidence  
- Listing overclaims Vision/image generation  

---

## After Internal

See `INTERNAL_TESTING_PLAN.md` and `PRODUCTION_ROLLOUT_PLAN.md`.  
Do **not** jump to 100% Production without staged confidence.
