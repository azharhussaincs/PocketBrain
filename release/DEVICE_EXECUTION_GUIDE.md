# Device Execution Guide — Phase 18

**Purpose:** Real physical Android validation.  
**Binary:** Signed release AAB/APK from SIGNING_EXECUTION_GUIDE (prefer release/preview native build with `llama.rn`).  
**OS:** Android API **26+** (minSdk 26). Prefer API 31–35 mid-range phone.  
**Rule:** Record Pass/Fail/Blocked on paper or your QA sheet. Do not invent results into the repo unless you actually ran them.

Also use: `DEVICE_QA_CHECKLIST.md`, `HARDWARE_VERIFICATION_PLAN.md`.

---

## 0. Device preparation

| Step | Action | Pass criteria |
| --- | --- | --- |
| 0.1 | Factory-reset optional; or clear app data if retesting | Known-clean state |
| 0.2 | Enable Developer options + USB debugging if using `adb` | `adb devices` lists phone |
| 0.3 | Note model, RAM, free storage, Android version | Written on QA sheet |
| 0.4 | Charge ≥50%; disable battery kill for PocketBrain after install | App not force-stopped by OEM |

---

## 1. Installation

| ID | Scenario | Steps | Expected | Pass | Fail |
| --- | --- | --- | --- | --- | --- |
| I1 | Fresh install | Install AAB via Play Internal **or** `adb install` / bundletool of release artifact | App launches to consent/Home | Launch &lt; ~10s warm OK | Crash on open |
| I2 | Upgrade install | Install prior build if any, then upgrade to 1.9.3/16 | Data retained where applicable; no crash | Opens after upgrade | Wipe/crash |
| I3 | Uninstall/reinstall | Uninstall → reinstall | Clean first-run | Consent appears | Stuck splash |

---

## 2. First-run / privacy

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| F1 | Consent gate | Privacy/Terms/AI disclaimer accept required | Cannot skip illegally | Bypass without accept |
| F2 | Open in-app Privacy | Shows policy text | Readable | Blank |

---

## 3. Offline / network

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| N1 | Airplane mode after model installed | Chat/Workspace still usable offline | Works | Forced online |
| N2 | Download with airplane on | Clear offline error | Actionable message | Silent hang |
| N3 | Wi‑Fi only setting on cellular | Blocks or warns per Settings | Matches setting | Downloads on cell when Wi‑Fi-only on |

---

## 4. Downloads

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| D1 | Enqueue starter model | Progress; completes | Installed in Models | Crash / corrupt install |
| D2 | Pause / resume | Resumes or restarts cleanly | Completes | Permanent stuck |
| D3 | Cancel mid-download | Job cancelled; partial cleaned | Storage not littered | Orphan huge partial |
| D4 | Low storage | Pre-check or mid-fail with guidance | Clear error | Native crash |
| D5 | Retry after fail | New attempt works | Completes | Infinite fail loop |

---

## 5. GGUF inference

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| G1 | Chat with starter model | Streaming tokens; honest offline chat | Usable reply | Fabricated mock on release native; crash |
| G2 | Abort generation | Stop works | Stops | Hang |
| G3 | Switch model | Loads alternate if installed | Works | Crash on switch |
| G4 | Unload / memory | Settings unload if available; app stable | No ANR | OOM kill |

---

## 6. Multimodal honesty

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| M1 | OCR with image | On-device text or clear gate | Honest | Fake OCR text without engine |
| M2 | STT mic deny | Graceful disable | Message | Crash |
| M3 | STT mic allow | Transcription attempt | Works or clear engine error | Silent fail |
| M4 | Vision* | Output includes **Limited Vision** labeling; does not claim pixel proof | Honest | Confident fake caption as truth |
| M5 | Image generation | Gate / no fake pixels | No invented bitmap | Placeholder image |

---

## 7. Workspace / export

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| W1 | Create doc from template | Saves locally | Opens editor | Crash |
| W2 | Export DOCX/PDF | File created | Share sheet or saved | Crash |
| W3 | Share unavailable path | Error that file still saved | Clear Alert | Silent no-op |

---

## 8. Permissions

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| P1 | Deny camera | Vision/OCR camera blocked gracefully | OK | Crash |
| P2 | Deny photos | Library pick blocked gracefully | OK | Crash |
| P3 | Deny mic | STT blocked gracefully | OK | Crash |

---

## 9. System conditions

| ID | Test | Expected | Pass | Fail |
| --- | --- | --- | --- | --- |
| S1 | Battery saver mode | App remains usable; may throttle threads | Stable | Crash |
| S2 | App restart mid-download | Queue survives or recoverable | Documented behavior | Data loss of all jobs without recovery |
| S3 | Cold start after kill | Returns to usable UI | OK | Boot loop |
| S4 | Stress: rapid tab switch | No freeze &gt;5s | OK | ANR dialog |

---

## 10. P0 gate for Internal Testing

All of the following **must PASS** before recommending Internal rollout:

- [ ] I1 Fresh install  
- [ ] F1 Consent  
- [ ] D1 Starter download (or documented network Blocked)  
- [ ] G1 Chat inference on native build  
- [ ] N1 Offline chat after install  
- [ ] P1–P3 denial paths  
- [ ] M4 Vision honesty label  
- [ ] M5 No fake image pixels  
- [ ] W2 One export format  

If any P0 fails: **do not** expand testers; triage bug; rebuild only if repo defect (then minimal fix under freeze rules).

---

## Recording template

```text
Device: ________  Android: ________  RAM: ________  Build: 1.9.3 (16)
Tester: ________  Date: ________
P0 result: PASS / FAIL
Notes: ________
```
