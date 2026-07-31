# Dependency audit — Phase 15

**Date:** 2026-07-30  
**Baseline:** `package.json` PocketBrain **1.9.2** (Expo SDK **57**)

## Policy

- Prefer Expo-aligned versions already locked by the SDK.  
- Do **not** remove peer/plugin packages solely because `src/` has no direct import.  
- Avoid adding packages without a measured need (feature freeze).

## Runtime dependencies

| Package | Version | Purpose | Keep? | Notes |
| --- | --- | --- | --- | --- |
| expo + expo-* modules | SDK 57 pins | Platform, FS, crypto, network, media, splash, etc. | Yes | Required ecosystem |
| expo-linking | ~57.0.4 | Expo linking / scheme support | Yes | No direct `src/` import; keep for Expo/`scheme` |
| expo-dev-client | ~57.0.10 | Custom native builds | Yes | Required for llama.rn / OCR native |
| llama.rn | ^0.12.7 | On-device GGUF | Yes | Core product |
| react / react-native | 19.2.3 / 0.86.2 | UI | Yes | SDK aligned |
| react-native-paper | ^5.15.3 | UI kit | Yes | |
| @react-navigation/* | v7 | Navigation | Yes | |
| zustand | ^5.0.14 | Local state | Yes | |
| @react-native-async-storage/async-storage | 2.2.0 | Persistence | Yes | |
| react-native-reanimated / worklets / screens / gesture-handler / safe-area | SDK pins | Navigation & motion peers | Yes | Do not remove |
| docx / pdf-lib / pptxgenjs / xlsx | various | Workspace export | Yes | |
| buffer / base-64 | various | Binary/export helpers | Yes | |
| expo-mlkit-ocr | ^0.2.7 | On-device OCR | Yes | Optional capability |
| expo-speech / expo-speech-recognition / expo-av | various | Speech / audio | Yes | |
| expo-image-picker / expo-document-picker / expo-sharing | various | Media & share | Yes | |
| expo-build-properties | ~57.0.8 | Native build knobs | Yes | largeHeap etc. |
| @expo/vector-icons | ^15.0.2 | Icons | Yes | |

## Dev dependencies

| Package | Purpose | Keep? |
| --- | --- | --- |
| typescript | Typecheck / `npm run lint` | Yes |
| babel-preset-expo | Metro/Babel | Yes |
| @types/* | Typings | Yes |

## Removals this phase

**None.** Candidates reviewed:

- `expo-linking` — unused in `src/`, but part of Expo linking/`scheme`; removal risks doctor/runtime regressions.  
- Reanimated / screens / font / system-ui — peers or configured modules; keep.

## Security / maintenance

- Prefer `npm audit` / Dependabot on a maintained fork when publishing begins.  
- `xlsx` is mature but historically security-sensitive — only parse user-selected exports/imports locally; do not fetch remote workbooks.  
- Native modules (`llama.rn`, OCR) require **release** device builds for real security/perf validation.

## Conclusion

Dependency set matches the feature-frozen product. No unused packages were safe to delete without Expo ecosystem risk.
