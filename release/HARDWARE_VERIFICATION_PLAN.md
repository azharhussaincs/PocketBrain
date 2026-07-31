# Hardware Verification Plan — PocketBrain (Phase 14)

**Binary under test:** use instructions in `DEVICE_QA_CHECKLIST.md` (How to obtain the binary). Expect marketing version **1.9.3** / `versionCode` **16** unless testing a later upload.


**Status:** All items below are **UNVERIFIED** until a native build is exercised on hardware.  
**Do not** mark complete without device evidence (logcat + checklist PASS).

Companion checklist: [`DEVICE_QA_CHECKLIST.md`](DEVICE_QA_CHECKLIST.md).

---

## Preconditions

1. Full Android SDK (platforms + build-tools) **or** EAS build artifact.  
2. Physical device API 26+ (preferred) or emulator with Google Play services as needed.  
3. Native binary with `llama.rn` linked (`npx expo run:android` or release APK/AAB).  
4. Wi‑Fi for first model download; then Airplane mode for offline tests.  
5. Free storage ≥ 2× the smallest catalog model you will install.

```bash
adb devices
adb logcat -c
adb logcat | tee pocketbrain-device.log
```

---

## 1. GGUF inference (`llama.rn`)

| | |
| --- | --- |
| **How to verify** | Install a small GGUF from Marketplace → select in Models → Chat → send a short prompt |
| **Expected** | Streaming or final text from the model; Settings/runtime indicator is **not** mock |
| **Failure cases** | Expo Go mock banner; “native runtime unavailable”; OOM/crash; hang with no error |
| **Logs** | `llama`, `InferenceEngine`, `AIService`, fatal React Native exceptions |

---

## 2. OCR (`expo-mlkit-ocr`)

| | |
| --- | --- |
| **How to verify** | Playground → OCR → pick/capture image with clear text |
| **Expected** | Recognized text **or** explicit unavailable error (never invented OCR) |
| **Failure cases** | Silent empty success; crash on permission; Expo Go missing module |
| **Logs** | `OcrService`, ML Kit, permission denials |

---

## 3. Speech-to-text (STT)

| | |
| --- | --- |
| **How to verify** | Grant mic → start listening → speak a short phrase |
| **Expected** | Transcript or clear engine/permission error |
| **Failure cases** | Hang on listening; crash on deny; uploads claimed (should not) |
| **Logs** | `SpeechToTextService`, `expo-speech-recognition`, `RECORD_AUDIO` |

---

## 4. Text-to-speech (TTS)

| | |
| --- | --- |
| **How to verify** | Playground TTS → enter text → Speak |
| **Expected** | Audible OS voice; stop works |
| **Failure cases** | No audio without error; crash on empty string (should validate) |
| **Logs** | `TextToSpeechService`, `expo-speech` |

---

## 5. Vision

| | |
| --- | --- |
| **How to verify** | Vision task with image + installed vision-capable model if listed |
| **Expected** | Honest gate or prompt-assisted text path; **not** marketed as full multimodal pixels |
| **Failure cases** | Fabricated image understanding without model; crash on missing file |
| **Logs** | `VisionService`, `AIService` |

---

## 6. Downloads

| | |
| --- | --- |
| **How to verify** | Start download → pause → resume → complete; repeat cancel/retry |
| **Expected** | Progress UI; Wi‑Fi-only respected; SHA failure surfaces clearly |
| **Failure cases** | Stuck 0%; completed without file; cellular leak when Wi‑Fi-only on |
| **Logs** | `DownloadManager`, `expo-file-system`, network errors |

---

## 7. Export

| | |
| --- | --- |
| **How to verify** | Workspace → export TXT, MD, PDF, DOCX (minimum); open or share |
| **Expected** | Share sheet / file written; openable on device |
| **Failure cases** | Empty file; crash in Buffer/polyfill; share cancel crashes app |
| **Logs** | `ExportService`, exporter module names, JS exceptions |

---

## Evidence pack (required before claiming verification)

For each feature marked PASS, attach:

1. Device model + Android version  
2. Build fingerprint / versionName / versionCode  
3. Screenshot or short screen recording (optional but preferred)  
4. Relevant `logcat` excerpt without personal content  
5. Checklist row ID from `DEVICE_QA_CHECKLIST.md`

Until that pack exists, report status as **UNVERIFIED**.
