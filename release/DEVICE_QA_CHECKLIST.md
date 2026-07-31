# Device QA Checklist — PocketBrain (Phase 14)

**Version under test:** ________ (expect **1.0.1** / `versionCode` **18**; legacy packaging docs may say 1.9.x)  
**Build type:** [ ] debug [ ] release [ ] EAS preview [ ] EAS production  
**Binary source:** [ ] `eas build` artifact [ ] local `bundleRelease`/`assembleRelease` [ ] `expo run:android`  
**Device:** ________ · **Android API:** ________  
**Tester:** ________ · **Date:** ________  

**Rule:** Leave **Actual / P/F / Notes** blank until tested on hardware. Do not invent PASS.

Priority: **P0** = release blocker · **P1** = high · **P2** = medium

---

## How to obtain the binary under test (for another engineer)

1. Follow `DEPLOYMENT_RUNBOOK.md` §1–3 (clone, `npm install`, `npm run verify:all`).  
2. Prefer **EAS production or preview** artifact, or local signed release after `APP_SIGNING.md`.  
3. For GGUF/OCR/STT: use a **native** build (not Expo Go).  
4. Record the exact `versionName` / `versionCode` from Settings → About (or `adb shell dumpsys package com.pocketbrain.app`).  
5. Attach logcat: `adb logcat -c && adb logcat | tee pocketbrain-qa.log`.  

Companion: `HARDWARE_VERIFICATION_PLAN.md`, `PRODUCTION_HANDOFF.md`.

---

## A. Install & launch

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Fresh install | Uninstall prior build if any | App installs; splash → onboarding or Home | P0 | | | |
| A2 | Upgrade install | Prior PocketBrain installed | Opens; local data not wiped silently | P1 | | | |
| A3 | Cold start | Fresh process | No crash in 30s; splash dismisses | P0 | | | |
| A4 | Kill & relaunch | App was used | Returns to sensible state | P1 | | | |
| A5 | After device reboot | Models previously installed | App launches; models still listed | P0 | | | |

---

## B. Onboarding & privacy

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Consent gate | Fresh install / cleared storage | Cannot proceed without Privacy/Terms/AI checks | P0 | | | |
| B2 | Open legal from onboarding | On consent screen | In-app Privacy/Terms display | P1 | | | |
| B3 | Download preference | Complete onboarding | Preference persists in Settings | P2 | | | |
| B4 | Finish onboarding | All required checks | Lands on Home; gate does not loop | P0 | | | |

---

## C. Home & Marketplace

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Home task grid | Onboarding done | Tasks visible; tap opens detail | P0 | | | |
| C2 | Marketplace browse | Network available | Cards show size/RAM/license/offline | P0 | | | |
| C3 | Discovery filters | Marketplace open | Filters change results; no crash | P1 | | | |
| C4 | Model detail | Pick a listing | Requirements / why-recommended readable | P1 | | | |

---

## D. Downloads & models

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | Start download (Wi‑Fi) | Consent allows downloads | Progress in Downloads | P0 | | | |
| D2 | Pause / resume | Active download | Pause stops; resume continues | P1 | | | |
| D3 | Cancel | Active download | Cancelled; recoverable state | P1 | | | |
| D4 | Retry failed | Failed job exists | Retry restarts | P1 | | | |
| D5 | SHA verify | Catalog has hash | Mismatch fails clearly | P1 | | | |
| D6 | Install complete | Download finished | Model in Models; selectable | P0 | | | |
| D7 | Delete model | Installed model | Removed; storage freed | P0 | | | |
| D8 | Install another | One model installed | Second installs; switch works | P0 | | | |
| D9 | Update / reinstall | Update available / forced | Succeeds or rolls back | P1 | | | |

---

## E. Chat & inference

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | Chat without model | No install | Gate; no invented answer | P0 | | | |
| E2 | GGUF chat native | Model + `llama.rn` build | Real response; not Expo Go mock | P0 | | | |
| E3 | Missing runtime honesty | Installed file, no native runtime | Clear error or labeled mock | P0 | | | |
| E4 | Copy / share / regenerate | Chat reply exists | Actions succeed | P1 | | | |
| E5 | Offline chat | Model installed; Airplane mode | Local chat works | P0 | | | |

---

## F. Workspace & export

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Create document | Workspace open | Doc appears | P0 | | | |
| F2 | Edit + autosave | Doc open | Persists after reopen | P0 | | | |
| F3 | Export TXT | Doc with content | Share/file OK | P0 | | | |
| F4 | Export Markdown | Doc with content | Share/file OK | P1 | | | |
| F5 | Export PDF | Doc with content | Share/file OK | P0 | | | |
| F6 | Export DOCX | Doc with content | Share/file OK | P1 | | | |
| F7 | Export PPTX | Doc with content | Share/file OK | P2 | | | |
| F8 | Export XLSX/CSV | Spreadsheet/doc | Share/file OK | P2 | | | |

---

## G. Multimodal

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | TTS | Playground | Speaks text | P1 | | | |
| G2 | STT allow mic | Mic granted | Transcript or clear engine error | P1 | | | |
| G3 | STT deny mic | Deny permission | Message; app stable | P0 | | | |
| G4 | OCR | Native build + image | Text or unavailable (never fake) | P1 | | | |
| G5 | Vision | Image + gate path | Honest behavior | P1 | | | |
| G6 | Image generation | Any | Refuses fake pixels | P0 | | | |

---

## H. Files, storage, settings, search

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H1 | Files explorer | Generated/docs exist | List/open/share | P1 | | | |
| H2 | Storage manager | Models/files present | Breakdown + cleanup | P1 | | | |
| H3 | Theme toggle | Settings | Light/dark applies | P2 | | | |
| H4 | Wi‑Fi-only downloads | Setting on; cellular | Download blocked | P1 | | | |
| H5 | Offline mode setting | Setting on | Network features blocked | P1 | | | |
| H6 | Global search | Data exists | Finds entries | P2 | | | |
| H7 | Legal screens | Settings → Legal | Privacy/Terms/FAQ/Licenses | P0 | | | |

---

## I. Stress & edge

| ID | Description | Preconditions | Expected result | Priority | Actual | P/F | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I1 | Low storage | Near-full device | Clear install error | P1 | | | |
| I2 | Deny camera | Vision/OCR capture | Graceful disable | P1 | | | |
| I3 | Long chat scroll | Many messages | Usable list | P2 | | | |
| I4 | Background download | Switch apps mid-download | Recoverable | P2 | | | |
| I5 | TalkBack smoke | TalkBack on | Tabs/labels announced | P1 | | | |

---

## Sign-off

| Gate | Result |
| --- | --- |
| All P0 PASS | [ ] Yes [ ] No |
| GGUF E2 PASS | [ ] Yes [ ] No |
| Ready for screenshots | [ ] Yes [ ] No |
| Ready for Internal testing upload | [ ] Yes [ ] No |

**Defects / logcat refs:**

```
(add after testing)
```
