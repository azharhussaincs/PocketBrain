# Screenshot Capture Guide — PocketBrain (Phase 11)

**Rule:** Do **not** fabricate screenshots. Do **not** place mockup PNGs in `assets/play/screenshots/`.  
**Status:** Capture is **pending** until a physical device (or emulator) runs a native build.

---

## Play requirements (phone)

| Requirement | PocketBrain target |
| --- | --- |
| Minimum phone screenshots | **≥ 2** (recommend **6–8**) |
| Format | PNG or JPEG |
| Content | Real UI from the installed binary |
| Orientation | Portrait preferred for phone listing |

Device sizes commonly accepted by Play (capture on a phone near these):

| Class | Example resolution |
| --- | --- |
| Phone | 1080 × 1920 or 1080 × 2400 |
| Phone (tall) | 1440 × 3200 |
| 7-inch tablet (optional) | 1200 × 1920 |
| 10-inch tablet (optional) | 1600 × 2560 |

`app.json` sets `ios.supportsTablet: true` / Android tablet not specially optimized — tablet screenshots are optional unless you enable a tablet listing.

---

## Output folder & naming

Save **only real captures** to:

```text
assets/play/screenshots/
```

### Required naming convention

```text
01_home_light.png
02_marketplace.png
03_chat.png
04_workspace.png
05_downloads.png
06_files_storage.png
07_settings_privacy.png
08_onboarding_consent.png
```

Optional:

```text
09_models_installed.png
10_playground_ocr.png
tablet_01_home.png
```

Do not use spaces. Use lowercase snake_case. Prefix with a two-digit order index.

---

## Capture sequence (after device QA smoke PASS)

Use a **native** build (`expo run:android` or signed release), not Expo Go, so GGUF / OCR screens look honest.

| Step | Screen | How to prepare | File name |
| --- | --- | --- | --- |
| 1 | Onboarding (optional) | Fresh install; stop on consent if usable | `08_onboarding_consent.png` |
| 2 | Home | Light theme; task grid visible | `01_home_light.png` |
| 3 | Marketplace | Open a model card with size/RAM/license | `02_marketplace.png` |
| 4 | Chat | Short real/local reply (or labeled state if no model yet — prefer post-install) | `03_chat.png` |
| 5 | Workspace | Document open with toolbar | `04_workspace.png` |
| 6 | Downloads | Queue or completed download | `05_downloads.png` |
| 7 | Files or Storage | Storage breakdown or file list | `06_files_storage.png` |
| 8 | Settings → Privacy / Legal | Privacy section visible | `07_settings_privacy.png` |

### Capture tips

1. Disable developer overlays / demo mode watermarks if possible.  
2. Prefer light theme for the primary set (add dark variants only as extras).  
3. Do not photoshop fake chat bubbles or invent OCR text.  
4. Hide personal emails/photos in the frame.  
5. After capture, update `store/play/LISTING.md` checklist boxes.

---

## Android capture commands

```bash
adb devices
adb shell screencap -p /sdcard/pocketbrain_shot.png
adb pull /sdcard/pocketbrain_shot.png ./assets/play/screenshots/01_home_light.png
```

Or use Android Studio’s screenshot tool / device screenshot chord.

---

## Acceptance checklist

- [ ] ≥2 PNGs present under `assets/play/screenshots/`  
- [ ] Each file shows real PocketBrain UI from the binary under test  
- [ ] Names follow the convention above  
- [ ] No fabricated/marketing-only mockups  
- [ ] Listing assets checklist updated  

**Until boxes are checked, screenshots remain a Critical external blocker (C5).**
