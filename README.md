# PocketBrain

<p align="center">
  <img src="assets/brand/logo-horizontal.svg" alt="PocketBrain" width="520" />
</p>

<p align="center">
  <strong>Offline-first AI Operating System for mobile</strong><br/>
  Download open-source models · Run inference on-device · Private chat &amp; Workspace · No mandatory cloud · No mandatory account
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-1.9.3-0F766E" />
  <img alt="completion" src="https://img.shields.io/badge/repo_100%25_play_external-0F766E" />
  <img alt="platform" src="https://img.shields.io/badge/platform-Android%20(primary)%20%7C%20iOS%20(prebuild)-informational" />
  <img alt="expo" src="https://img.shields.io/badge/Expo-SDK%2057-000020" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue" />
  <img alt="play" src="https://img.shields.io/badge/Google%20Play-NOT%20READY-critical" />
</p>

| Field | Value |
| --- | --- |
| **App name** | PocketBrain |
| **Package** | `com.pocketbrain.app` |
| **App version** | **1.0** |
| **Android `versionCode`** | 16 |
| **Repository completion** | **100%** (project scope — [`release/FINAL_RELEASE_CERTIFICATION.md`](release/FINAL_RELEASE_CERTIFICATION.md)) |
| **Production validation** | **Awaiting external execution** |
| **External readiness** | Blocked on legal hosting, signing, device QA, screenshots, Play Console |
| **Google Play readiness** | ❌ **NOT READY** ([`release/FINAL_RELEASE_CERTIFICATE.md`](release/FINAL_RELEASE_CERTIFICATE.md)) |
| **License** | MIT ([`LICENSE`](LICENSE)) — template copyright notice from Expo; project code is MIT-licensed |
| **Support** | `support@pocketbrain.app` |
| **Privacy URL (configured)** | `https://pocketbrain.app/privacy` (**deploy static HTML** — see [`store/legal/HOSTING.md`](store/legal/HOSTING.md); Phase 16 live probe: URL returns SPA shell, **not** policy HTML — still a blocker) |
| **Terms URL (configured)** | `https://pocketbrain.app/terms` (**deploy static HTML** — see [`store/legal/HOSTING.md`](store/legal/HOSTING.md); same SPA-shell finding) |
| **Brand** | [`assets/brand/BRAND_GUIDELINES.md`](assets/brand/BRAND_GUIDELINES.md) |

> **Official documentation.** This README is the primary onboarding document for developers. Play Console answers, signing, Data Safety, and QA evidence live under [`release/`](release/) and [`store/`](store/). Keep this file synchronized whenever structure, scripts, or release status change.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Features](#2-features)
3. [Technology stack](#3-technology-stack)
4. [Requirements](#4-requirements)
5. [Installation](#5-installation)
6. [Project setup](#6-project-setup)
7. [Running the project](#7-running-the-project)
8. [Building release artifacts](#8-building-release-artifacts)
9. [Folder structure](#9-folder-structure)
10. [Important files](#10-important-files)
11. [npm scripts](#11-npm-scripts)
12. [Architecture](#12-architecture)
13. [AI model system](#13-ai-model-system)
14. [User workflow](#14-user-workflow)
15. [Export system](#15-export-system)
16. [Storage](#16-storage)
17. [Security & privacy](#17-security--privacy)
18. [Testing](#18-testing)
19. [Google Play release guide](#19-google-play-release-guide)
20. [Troubleshooting](#20-troubleshooting)
21. [FAQ](#21-faq)
22. [Known limitations](#22-known-limitations)
23. [Roadmap](#23-roadmap)
24. [Contributing](#24-contributing)
25. [Changelog](#25-changelog)
26. [License](#26-license)
27. [Contact](#27-contact)
28. [Release readiness & completion](#release-readiness-report)

---

## 1. Project overview

### What is PocketBrain?

PocketBrain is an **offline-first AI operating system** for mobile. Users download open-source model weights to the device, then chat, create documents, and use multimodal tools **without sending prompts to proprietary cloud AI APIs by default**.

It is **not** a thin wrapper around OpenAI / Claude / Gemini. There is **no mandatory account**, **no Firebase/Supabase backend**, and **no analytics/ads SDK** at launch.

### Why it exists

- Put capable open-source models in the user’s pocket
- Keep chats, documents, and model files on-device by default
- Give clear, honest capability gates when a runtime or model is missing (never invent AI/OCR/vision/image output)

### Goals

| Goal | Status in code |
| --- | --- |
| Offline core AI after model install | Implemented (requires native `llama.rn` build for real GGUF) |
| Multi-model marketplace lifecycle | Implemented |
| Workspace + multi-format export | Implemented |
| Play-oriented privacy/compliance docs | Documented; **live legal URLs & device QA still open** |
| Honest multimodal gates | Implemented |

### Offline-first & privacy-first

- **Offline-first:** After a model is installed, chat/workspace core paths are designed to work without network. Network is used for model downloads and user-tapped external links.
- **Privacy-first:** No accounts; downloads require consent; mic/camera/photos only when a feature starts; analytics/crash SDKs are not bundled.

### Supported AI capabilities (honest)

| Capability | Implementation | Runtime notes |
| --- | --- | --- |
| Text chat / coding / study tasks | `AIService` + InferenceEngine | Real GGUF via `llama.rn` in **native** builds; Expo Go uses labeled **mock** |
| OCR | `expo-mlkit-ocr` | Needs custom native build |
| Speech-to-text | `expo-speech-recognition` | Needs native build + mic permission |
| Text-to-speech | `expo-speech` | Available in Expo Go and native |
| Vision | `VisionService` | Prompt-assisted / gated — not full pixel multimodal production |
| Image generation | `ImageGenerationService` | **Refuses fake pixels** until diffusion runtime + model exist |
| Video generation | Task UI only | Deferred / not production |

### Supported model formats

| Format | Production path | Notes |
| --- | --- | --- |
| **GGUF** | `llama.rn` / llama.cpp adapter | Primary production text path |
| ONNX / MediaPipe / Core ML / MLC | Adapter stubs | Report unavailable — do not fabricate |

Catalog types also include categories such as embedding/translation (see `src/types/models.ts`); shipping depends on catalog listings + runtime availability.

### Supported Workspace export formats

Implemented in `ExportService`: **DOCX, PDF, PPTX, XLSX, CSV, Markdown, HTML, TXT, JSON, SVG**.

Images/audio/video as first-class Workspace exporters are **not** full production pipelines; capture/share may use OS share sheet where files exist.

---

## 2. Features

### AI & chat

- Task-first Home (Write, Study, Coding, Speech, Vision, etc.)
- Private on-device chat (folders, pin/favorite, search, export, regenerate/continue/edit)
- Markdown rendering + response actions (copy / share / save / export / favorite)
- AI Playground with multiple modes
- Smart “no model” gates with recommended installs
- Conversation stats & message timestamps

### Marketplace & models

- **Get** tab marketplace with **All models** plus Small / Medium / Large size filters
- Purpose chips (Recommended, Coding, Vision, …) — full size range where catalog allows
- Why-recommended explanations; RAM over-budget is a warning (user may still download)
- Install / pause / resume / cancel / retry downloads
- Downloads over **Wi‑Fi or mobile data** by default (optional “Wi‑Fi only” in Settings)
- SHA-256 verification when catalog provides a hash
- Multi-model install, switch, update/reinstall with rollback backup, delete anytime
- Optional catalog update checks in Settings

### Workspace

- Document OS: create, edit, autosave hooks, templates, AI create helpers
- Export/share DOCX, PDF, PPTX, XLSX, CSV, MD, HTML, TXT, JSON, SVG

### Downloads, files, storage

- Download Center (reachable from **Mine** / Settings; not a primary tab)
- Files explorer (categories, search, multi-select, share)
- Generated content library + Workspace deep links
- Storage manager + unused-model cleanup recommendations

### Settings, privacy, legal

- Theme, performance mode, **optional** Wi‑Fi-only downloads, offline mode
- Onboarding consent (Privacy, Terms, AI disclaimer)
- In-app Privacy, Terms, FAQ, Copyright, licenses, model licenses, support, report issue
- Analytics/crash toggles shown as **unavailable** (no SDK bundled)
- Shortcuts to Workspace, Playground, and Downloads

### Navigation (end-user)

Primary tabs: **Home · Get · Chat · Mine · Settings**. Workspace / Downloads / Playground remain in the app via Settings (and deep links), not crowded into the tab bar.

### Branding & release packaging

- SVG brand system + Play feature graphic
- `/release` Play Console documentation pack
- Hostable legal HTML under `store/legal/` (must be published)

---

## 3. Technology stack

### Runtime & UI

| Technology | Purpose |
| --- | --- |
| **React Native 0.86** | Mobile UI runtime |
| **Expo SDK 57** | Tooling, native modules, prebuild, config plugins |
| **TypeScript** | Strict typing (`tsconfig` extends Expo base) |
| **React 19** | UI library |
| **React Navigation** | Bottom tabs + native stacks |
| **React Native Paper (MD3)** | Material Design 3 components + theming |
| **Zustand** | Client state (app, chat, settings, consent) |
| **AsyncStorage** | Persist settings/consent/installed metadata |
| **Reanimated / Gesture Handler / Screens / Safe Area** | Navigation & motion primitives |
| **@expo/vector-icons** | Icon glyphs |

### On-device AI & media

| Package | Purpose |
| --- | --- |
| **llama.rn** | Native GGUF / llama.cpp inference (custom build) |
| **expo-mlkit-ocr** | On-device OCR |
| **expo-speech** | On-device TTS |
| **expo-speech-recognition** | STT |
| **expo-image-picker** | Camera / library for Vision/OCR |
| **expo-device** | Hardware profiling inputs |
| **expo-network** | Connectivity for download policy |
| **expo-file-system** | Model/document file I/O |
| **expo-clipboard / expo-sharing** | Copy & OS share |
| **expo-document-picker** | Import documents |
| **expo-crypto** | IDs / hashing helpers |
| **expo-constants / expo-linking / expo-font / expo-splash-screen / expo-status-bar** | App metadata, deep links, fonts, splash, status bar |
| **expo-dev-client** | Custom development client |
| **expo-build-properties** | minSdk 26, targetSdk 35, compileSdk 36, largeHeap, iOS 16.4 |

### Workspace exporters

| Package | Purpose |
| --- | --- |
| **docx** | DOCX generation |
| **pdf-lib** | PDF generation |
| **pptxgenjs** | PPTX generation |
| **xlsx** | XLSX/CSV workbook paths |
| **buffer / base-64** | Binary polyfills for exporters |

### Tooling

| Package | Purpose |
| --- | --- |
| **babel-preset-expo** | Metro/Babel transform |
| **typescript** | `tsc --noEmit` lint/typecheck |
| **@types/\*** | Type definitions |

**Explicitly not included:** Firebase, Supabase, Sentry, Amplitude, Mixpanel, Segment, Datadog, ad SDKs.

---

## 4. Requirements

### Developer machine (minimum)

| Requirement | Notes |
| --- | --- |
| **Node.js** | LTS recommended (project verified with modern Node 20+/22) |
| **npm** | Comes with Node |
| **Git** | Clone repository |
| **Java JDK** | Required for Android Gradle (Android Studio JDK is fine) |
| **Android Studio** + SDK | Platforms, build-tools, platform-tools; emulator optional but recommended |
| **Android SDK** | `minSdk 26`, `targetSdk 35`, `compileSdk 36` (configured in `app.json`) |
| **Physical device or emulator** | Required for `expo run:android` and GGUF QA |

### Recommended for local inference QA

- Mid-range Android phone, **6 GB+ RAM**
- Free storage ≥ 2× largest model you will install
- Network (Wi‑Fi **or** mobile data) for first model download

### Expo Go vs native

| Environment | What works |
| --- | --- |
| **Expo Go** | UI, TTS, labeled **mock** chat when no native runtime; **not** production GGUF |
| **Custom native build** | `llama.rn`, OCR, full STT, real offline inference |

---

## 5. Installation

From scratch:

```bash
git clone https://github.com/azharhussaincs/PocketBrain.git
cd PocketBrain
npm install
```

| Command | Purpose |
| --- | --- |
| `git clone …` | Copy the repository |
| `cd PocketBrain` | Enter project root (where `package.json` lives) |
| `npm install` | Install dependencies from `package-lock.json` into `node_modules/` |

Then verify:

```bash
npm run lint
npm run typecheck
npm run test
npm run verify:release
```

Optional brand raster refresh:

```bash
npm run export:brand
```

---

## 6. Project setup

### Environment

1. Install Node + Android Studio SDK components.
2. Set `ANDROID_HOME` / `ANDROID_SDK_ROOT` to your SDK path.
3. Ensure `adb` works: `adb devices`.

### Expo / native modules

PocketBrain uses **config plugins** in `app.json` (`llama.rn`, ML Kit OCR, speech recognition, image picker, build-properties, splash, etc.). After dependency or plugin changes:

```bash
npx expo prebuild --platform android
```

This generates/updates the **`android/`** native project (gitignored by default — regenerate as needed).

### iOS

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

Requires macOS + Xcode. `ios.deploymentTarget` is **16.4**. The repo may not contain a committed `ios/` folder; prebuild creates it.

### Android config highlights (`app.json`)

- Package: `com.pocketbrain.app`
- `allowBackup: false`
- Declared permissions: `INTERNET`, `ACCESS_NETWORK_STATE`
- Blocked: `SYSTEM_ALERT_WINDOW`
- Plugins merge additional runtime permissions (mic, storage legacy maxSdk 32, vibrate, etc.) — see [`release/PERMISSIONS.md`](release/PERMISSIONS.md)

---

## 7. Running the project

### Development Metro

```bash
npm start
# or
npx expo start
```

Scan the QR code with a **development build**, or press `a` for Android when a device/emulator is connected.

**Web (limited):**

```bash
npm run web
```

Not the primary target; native modules will be unavailable or stubbed.

### Native Android (required for real GGUF / OCR / full STT)

```bash
npx expo prebuild --platform android
npx expo run:android
# or
npm run android
```

### Expo Go limitations (critical)

- **No production GGUF.** `AIService` uses a labeled mock in Expo Go / when native runtime is missing.
- If a model file is installed but native runtime is unavailable, PocketBrain **throws** rather than inventing answers.
- OCR / full STT need the custom native binary.

---

## 8. Building release artifacts

### EAS profiles (`eas.json`)

| Profile | Purpose |
| --- | --- |
| `development` | Dev client APK, internal distribution |
| `preview` | Internal APK for testers |
| `production` | **Android App Bundle (AAB)** for Play |

Example (requires EAS account + credentials):

```bash
npm install -g eas-cli
eas login
eas build -p android --profile production
eas submit -p android --profile production
```

### Local Gradle (after prebuild)

```bash
cd android
./gradlew assembleRelease    # APK
./gradlew bundleRelease      # AAB
```

**Warning:** Release builds **must not** use the debug keystore. The Expo plugin `plugins/withAndroidReleaseSigning.js` fails closed without `PB_UPLOAD_*` / `keystore.properties`. Prefer EAS production credentials — see [`release/APP_SIGNING.md`](release/APP_SIGNING.md). Never upload a debug-signed AAB.

### JS export smoke test (no device)

```bash
npx expo export --platform android --output-dir .tmp-export
```

Verified in Final Verification: Android bundle of **1882 modules** succeeded.

---

## 9. Folder structure

```
PocketBrain/
├── App.tsx                 # Root providers (Paper, Navigation, consent, error boundary)
├── index.ts                # Entry: Buffer polyfill + registerRootComponent
├── app.json                # Expo app config + plugins
├── eas.json                # EAS build/submit profiles
├── package.json            # Dependencies & npm scripts
├── babel.config.js         # babel-preset-expo + reanimated plugin
├── metro.config.js         # Expo Metro + buffer shim
├── tsconfig.json           # TypeScript (strict)
├── LICENSE                 # MIT
├── AGENTS.md / CLAUDE.md   # Agent guidance (Expo SDK 57 docs)
├── assets/                 # Icons, splash, brand, Play graphics
├── src/                    # Application source
├── store/                  # Play listing + hostable legal HTML (not React store)
├── release/                # Play/compliance/QA documentation pack
├── scripts/                # verify-release, export-brand-assets
├── tests/                  # node:test suites
├── android/                # Generated native project (typically gitignored)
└── ios/                    # Generated on prebuild (typically gitignored)
```

### `src/` — application source

| Path | Purpose | Important contents |
| --- | --- | --- |
| `src/app/` | Screens + navigation | `navigation/RootNavigator.tsx`, `screens/*` |
| `src/components/` | Shared UI | `ResponseActions`, `EmptyState`, `MarkdownText`, gates, cards |
| `src/services/` | Core app services | `AIService`, `ModelManager`, `DownloadManager`, `HardwareService` |
| `src/inference/` | Inference engine + adapters | `InferenceEngine`, `LlamaCppAdapter`, mock + future stubs |
| `src/ai/` | Multimodal services + registry | `ocr`, `speech`, `tts`, `vision`, `image`, `registry`; `runtime/` reserved (empty) |
| `src/workspace/` | Document OS | See workspace breakdown below |
| `src/discover/` | Tasks, recommendations, discovery filters, FeatureGate | Marketplace intelligence |
| `src/data/` | Static model catalog | `catalog.ts` |
| `src/files/` | File explorer + AI outputs | `FileExplorerService`, `GeneratedContentStore` |
| `src/storage/` | App storage manager | Cleanup / unused models helpers |
| `src/store/` | Zustand stores | `appStore`, `chatStore`, `settingsStore` |
| `src/privacy/` | Consent gate + consent store | Onboarding |
| `src/permissions/` | Runtime permission prompts | Least privilege |
| `src/legal/` | In-app legal screens + policy text | Privacy/Terms/FAQ/… |
| `src/search/` | Global on-device search | `globalSearch.ts` |
| `src/theme/` | MD3 light/dark brand theme | Teal system |
| `src/types/` | Shared TypeScript types | models, chat, inference, settings, hardware |
| `src/utils/` | Helpers | `format.ts` (bytes, IDs) |
| `src/i18n/` | String catalog scaffolding | English `t()` helper |
| `src/monetization/` | No-op interfaces | Free launch — no ads SDK |
| `src/hooks/` | Reserved | **Currently empty** (workspace hooks live under `src/workspace/hooks/`) |

#### `src/app/screens/` (presentation)

| Screen folder | Responsibility |
| --- | --- |
| `Home/` | Task-first entry and recommendations |
| `Marketplace/` | Model discovery and install CTAs |
| `Models/` | Installed models, switch, update, delete |
| `Downloads/` | Download Center queue and history |
| `Chat/` | Private conversations |
| `Playground/` | Mode-based AI experiments |
| `Files/` | On-device file explorer + AI outputs |
| `Storage/` | Storage usage and cleanup |
| `Search/` | Global on-device search |
| `Settings/` | Theme, privacy, legal, performance |

#### `src/workspace/` (document OS)

| Path | Purpose |
| --- | --- |
| `screens/` | Workspace list, editor shell, create flows |
| `editor/` | Document editing UI |
| `exporters/` | DOCX/PDF/PPTX/XLSX/text exporters |
| `generators/` | AI-assisted document creation helpers |
| `templates/` | Starter document templates |
| `services/` | `WorkspaceService`, export orchestration |
| `storage/` | Document persistence paths |
| `hooks/` | Autosave and editor hooks |
| `components/` | Workspace-specific UI |
| `types/` / `utils/` | Workspace types and helpers |

#### `src/inference/`

| Path | Purpose |
| --- | --- |
| `engine/` | `InferenceEngine` orchestration |
| `adapters/` | `LlamaCppAdapter`, mock, future ONNX/MediaPipe/Core ML/MLC stubs |

#### `src/ai/`

| Path | Purpose |
| --- | --- |
| `ocr/` | ML Kit OCR service |
| `speech/` | Speech recognition service |
| `tts/` | Text-to-speech service |
| `vision/` | Vision gate / prompt-assisted path |
| `image/` | Image generation (refuses fake pixels) |
| `registry/` | Model capability registry helpers |
| `runtime/` | Reserved empty directory for future runtimes |

### `assets/`

| Path | Purpose |
| --- | --- |
| `assets/icon.png`, `splash-icon.png`, `favicon.png` | Expo app icon / splash / web favicon |
| `assets/android-icon-*.png` | Adaptive icon layers |
| `assets/notification-icon.png` | Notification glyph raster |
| `assets/brand/` | SVG masters + guidelines + PNG exports |
| `assets/play/` | Feature graphic, 512 icon, promo/social concepts |
| `assets/play/screenshot-templates/` | Layout templates for future real captures (not Play-upload PNGs) |
| `assets/play/screenshots/` | **Real device captures only** — currently README/guidance; no fabricated store PNGs |

### `store/` (distribution metadata — not Zustand)

| Path | Purpose |
| --- | --- |
| `store/play/` | Listing copy, release notes, assets checklist |
| `store/legal/` | Hostable `privacy.html`, `terms.html`, `faq.html`, `contact.html` |

### `release/`

Play Console simulation, Data Safety, permissions, signing, QA, final verification reports (`FINAL_STATUS.md`, `FINAL_QA_REPORT.md`, `FINAL_PLAYSTORE_REPORT.md`, `FINAL_RELEASE_CHECKLIST.md`, and related checklists).

### `scripts/`

| Script | Purpose |
| --- | --- |
| `verify-release.mjs` | Version sync, permission/deps policy, required docs/assets |
| `export-brand-assets.py` | Rasterize brand SVGs to PNG for Expo/Play |

### `tests/`

Node.js built-in test runner suites: discovery, honesty gates, release policy, phase 7–10 packaging checks.

### `android/` / `ios/`

Generated by Expo prebuild. Treat as **build outputs** unless you intentionally commit them. Re-run prebuild after plugin changes.

---

## 10. Important files

| File | Role |
| --- | --- |
| [`README.md`](README.md) | This document — official developer documentation |
| [`package.json`](package.json) | Dependencies, version `1.9.3`, npm scripts |
| [`app.json`](app.json) | Expo name, icons, splash, Android/iOS IDs, plugins, legal URLs in `extra` |
| [`eas.json`](eas.json) | EAS development / preview / production profiles |
| [`babel.config.js`](babel.config.js) | Expo Babel preset (+ nested fallback) and Reanimated plugin |
| [`metro.config.js`](metro.config.js) | Default Expo Metro + `buffer` polyfill mapping |
| [`tsconfig.json`](tsconfig.json) | Strict TypeScript via Expo base |
| [`index.ts`](index.ts) | Registers `App` and polyfills `Buffer` for exporters |
| [`App.tsx`](App.tsx) | Theme, navigation, consent gate, download hydrate, font-scale cap |
| [`LICENSE`](LICENSE) | MIT text (Expo template copyright header still present) |
| [`AGENTS.md`](AGENTS.md) | Points agents to Expo SDK 57 docs |

There is **no** committed `expo-env.d.ts` required for day-to-day builds; Expo may generate env typings locally under `.expo/` (gitignored).

---

## 11. npm scripts

| Script | Command | Purpose | Expected result |
| --- | --- | --- | --- |
| `start` | `expo start` | Start Metro | Dev server URL / QR |
| `android` | `expo run:android` | Native Android run | Install/launch on device/emulator |
| `ios` | `expo run:ios` | Native iOS run | macOS + simulator/device |
| `web` | `expo start --web` | Web bundler | Browser (limited native APIs) |
| `typecheck` | `tsc --noEmit` | TypeScript check | Exit 0, no diagnostics |
| `lint` | `tsc --noEmit` | Same as typecheck (project lint gate) | Exit 0 |
| `test` | `node --test tests/*.test.mjs` | Unit/policy tests | All tests pass |
| `verify:release` | `node scripts/verify-release.mjs` | Release consistency gate | Prints version/permissions/llama.rn summary |
| `verify:assets` | `node scripts/verify-assets.mjs` | Play/brand raster assets | PASS/FAIL report |
| `verify:legal` | `node scripts/verify-legal.mjs` | Legal HTML + URL config | PASS/FAIL report |
| `verify:branding` | `node scripts/verify-branding.mjs` | Brand SVG/guidelines | PASS/FAIL report |
| `verify:docs` | `node scripts/verify-docs.mjs` | Required release docs | PASS/FAIL report |
| `verify:playstore` | `node scripts/verify-playstore.mjs` | Listing + Play pack | PASS/FAIL report |
| `verify:android` | `node scripts/verify-android.mjs` | SDK/signing/Gradle gates | PASS/FAIL report |
| `verify:build` | `node scripts/verify-build.mjs` | Signed AAB attempt | SKIP without credentials |
| `verify:all` | `node scripts/verify-all.mjs` | Run all verify suites | Aggregate PASS/FAIL |
| `prebuild` | `expo prebuild` | Generate native projects | Creates/updates `android/` / `ios/` |
| `export:brand` | `python3 scripts/export-brand-assets.py` | Regenerate brand PNGs | Writes under `assets/` |
| `doctor` | `npx expo-doctor` | Dependency health | Requires network to fetch doctor package |

---

## 12. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation (primary tabs)                                  │
│  Home · Get (Marketplace) · Chat · Mine · Settings           │
│  (+ Workspace / Downloads / Playground via Settings)         │
│  Legal · OnboardingConsentGate                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Discover / Feature gates                                     │
│  tasks · recommendations · discovery filters · FeatureGate  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Services                                                     │
│  AIService · ModelManager · DownloadManager · Hardware       │
│  WorkspaceService · FileExplorer · Storage · Permissions     │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
┌───────────▼───────────┐     ┌───────────▼───────────────────┐
│ Inference             │     │ Multimodal AI                 │
│  InferenceEngine      │     │  OCR · STT · TTS · Vision ·   │
│  LlamaCpp / Mock /    │     │  ImageGen · ModelRegistry     │
│  Future stubs         │     └───────────────────────────────┘
└───────────┬───────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│ Local persistence                                            │
│  Model files · Workspace docs · AI outputs · AsyncStorage   │
└─────────────────────────────────────────────────────────────┘
```

### Layers

1. **Presentation** — React Native Paper screens under `src/app/screens` and `src/workspace/screens`
2. **Business / discover** — task → model recommendations and capability gates
3. **Services** — orchestration without UI
4. **Inference & multimodal** — runtime adapters; never fabricate unavailable capabilities
5. **Storage** — on-device files + Zustand/AsyncStorage metadata

---

## 13. AI model system

### Lifecycle

1. User picks a task or opens **Get** (Marketplace)
2. Consent must allow downloads; optional Wi‑Fi-only setting may block cellular (default: Wi‑Fi **or** mobile data)
3. `DownloadManager` queues transfer (pause/resume/cancel/retry)
4. Optional SHA-256 verification when catalog provides a hash
5. `ModelManager` marks installed path + metadata
6. Chat/Playground call `AIService.generateText`
7. Engine loads via preferred runtime (`llama.cpp` when available)
8. User may switch models, update (backup + rollback on failure), or delete anytime

### Runtime selection

- Prefer listing `preferredRuntime`
- `llama.rn` when linked and available
- Mock only for Expo Go / explicit mock paths
- ONNX/MediaPipe/Core ML/MLC adapters return **unavailable**

### Storage location

Model binaries live under app sandbox paths managed by Expo FileSystem (via ModelManager). Metadata is tracked in app state / persistence — users own the files and can delete them from Models / Storage UI.

---

## 14. User workflow

```
Install app
    ↓
Splash → Onboarding consent (Privacy / Terms / AI disclaimer)
    ↓
Home → “Install your first model” (if none installed) or choose a task
    ↓
Get tab → pick Small / Medium / Large (or Any size) → Download
    ↓
Chat → ask anything (on-device after install)
    ↓
Copy · Share · Save · Export (Workspace via Settings if needed)
    ↓
(Optional) Mine → manage models · Downloads · Storage
```

Minimum path: **Get → Download small model → Chat**.

---

## 15. Export system

| Format | Module path | Notes |
| --- | --- | --- |
| DOCX | `docxExporter.ts` | Word documents |
| PDF | `pdfExporter.ts` | pdf-lib |
| PPTX | `pptxExporter.ts` | pptxgenjs |
| XLSX | `xlsxExporter.ts` | SheetJS |
| CSV | `xlsxExporter` helpers | Spreadsheet text |
| Markdown / HTML / TXT / JSON / SVG | `textExporters.ts` | Text/structured exports |
| Share | `ExportService.exportAndShare` | OS share sheet |

Default formats per document type are chosen in `WorkspaceService.defaultExportFormats`.

---

## 16. Storage

| Area | Responsibility |
| --- | --- |
| **Models** | Downloaded weights; delete frees space |
| **Workspace** | Documents under workspace storage paths |
| **AI outputs / Files** | GeneratedContentStore + FileExplorer categories |
| **Downloads** | Job queue + history metadata |
| **Cache / cleanup** | `AppStorageManager` + unused-model recommendations |
| **Settings/consent** | AsyncStorage-backed Zustand stores |

`allowBackup: false` reduces automatic cloud backup of app data on Android.

---

## 17. Security & privacy

| Topic | PocketBrain behavior |
| --- | --- |
| Accounts | None |
| Telemetry SDKs | None bundled |
| Ads / Ad ID | None |
| Network | Downloads + user-opened links only |
| Permissions | Runtime rationale; feature-scoped |
| Model integrity | Hash verify when catalog supplies SHA-256 |
| Encryption in transit | HTTPS for downloads/links |
| Cloud chat backend | None |

Details: [`release/DATA_SAFETY.md`](release/DATA_SAFETY.md), [`release/PERMISSIONS.md`](release/PERMISSIONS.md), in-app Privacy Policy.

---

## 18. Testing

### Automated

```bash
npm run lint          # TypeScript
npm run typecheck     # Same gate
npm test              # node:test suites in tests/
npm run verify:release
```

Suites cover discovery helpers, honesty gates (no fake AI/images), permissions/deps policy, brand/release packaging invariants, short-description length, and “no fabricated screenshots” checks.

### Manual / device QA

Use [`release/TEST_REPORT.md`](release/TEST_REPORT.md) and [`release/FINAL_QA_REPORT.md`](release/FINAL_QA_REPORT.md). **Device journeys were BLOCKED in Final Verification** (no hardware). Do not invent PASS results.

### Release verification script checks

- `package.json` ↔ `app.json` version match
- README mentions `App version: **x.y.z**`
- Listing + release notes version strings
- Minimal declared Android permissions
- No forbidden telemetry/backend deps
- Required brand/release files present
- `llama.rn` dependency + plugin registered

---

## 19. Google Play release guide

Master Console pack: [`release/PLAY_STORE_SUBMISSION.md`](release/PLAY_STORE_SUBMISSION.md).  
Final Play report: [`release/FINAL_PLAYSTORE_REPORT.md`](release/FINAL_PLAYSTORE_REPORT.md).

### Why Google asks — mapped to PocketBrain

| Console item | Why Google asks | PocketBrain action |
| --- | --- | --- |
| Developer account + identity/phone | Abuse prevention | Complete in Play Console |
| Privacy Policy URL | User Data policy | Publish `store/legal/privacy.html` at the exact URL (**currently SPA redirect, not policy HTML**) |
| Terms URL | Consumer clarity | Publish `store/legal/terms.html` |
| Support email / contact | User support path | `support@pocketbrain.app` + contact HTML |
| App signing | Integrity | EAS/upload keystore — **not debug** |
| AAB | Serving format | `eas build --profile production` or `bundleRelease` |
| Store listing + short/full description | Discovery & honesty | [`store/play/LISTING.md`](store/play/LISTING.md) |
| Icon 512 + feature graphic | Branding | Ready under `assets/play/` |
| Screenshots | Show real UI | Capture on device — **do not fabricate** |
| Content rating | Age appropriateness | Follow [`release/CONTENT_RATING.md`](release/CONTENT_RATING.md) |
| Data Safety | Transparency | Mirror [`release/DATA_SAFETY.md`](release/DATA_SAFETY.md) exactly |
| Ads / Advertising ID | Ads policy | Declare **No** |
| Target audience | Families rules | Adults; do **not** enroll Designed for Families unless redesigned |
| Permissions review | Least privilege | Justify via Permissions doc |
| Open-source notices | License compliance | In-app Licenses screens |
| Review notes | Help reviewers | [`release/REVIEW_NOTES.md`](release/REVIEW_NOTES.md) |
| Closed/internal testing | Quality before prod | Only after legal URLs + signed AAB + device smoke |
| Production rollout | Gradual risk control | Staged % after internal PASS |
| Post-release monitoring | Crashes/ANRs | Use Play Vitals; still no third-party crash SDK unless opted product decision |

### Current verified blockers before any track

1. Live Privacy/Terms HTTPS **200**
2. Non-debug signing + signed AAB
3. Physical device RC PASS
4. ≥2 real phone screenshots

---

## 20. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Cannot find module 'babel-preset-expo'` | Hoisting | Ensure `babel-preset-expo` in devDependencies; `babel.config.js` has nested fallback |
| Metro starts but Expo Router log for `src/app` | Folder name collision | Harmless for this RN Navigation app; ignore or rename later |
| `expo run:android` → no devices | No emulator/USB | Install emulator or enable USB debugging |
| Chat invents nothing / errors with installed model | Missing native runtime | Use custom build with `llama.rn` |
| Expo Go “mock” banner | Expected | Not a bug — use native build for GGUF |
| OCR/STT fails | Not linked / permission denied | Prebuild + grant mic/camera when prompted |
| Downloads blocked | Consent / Wi‑Fi-only / offline mode | Settings: enable downloads; turn **off** “Wi‑Fi only downloads” to use mobile data; disable Offline mode |
| `verify:release` fails on version | Docs out of sync | Update README, `LISTING.md`, `RELEASE_NOTES.md` to match `package.json` |
| `expo-doctor` network error | Registry unreachable | Retry with network; not a code defect |
| Release AAB rejected for signing | Debug keystore | Configure production signing ([`APP_SIGNING.md`](release/APP_SIGNING.md)) |
| Privacy URL rejection | SPA / no policy text | Deploy `store/legal/*.html` at exact URLs (no analytics SPA shell) |
| Sideload APK crashes / won’t install | Emulator-only (`x86_64`) build | Use **arm64-v8a** release APK for phones |

---

## 21. FAQ

1. **Can I use PocketBrain offline?** Yes for core local features after models are installed; downloads need network.
2. **Do I need an account?** No.
3. **Does PocketBrain upload my chats?** Not to a PocketBrain backend — there isn’t one.
4. **Why download a model?** On-device inference needs local weights.
5. **Can I install multiple models?** Yes.
6. **Can I delete models anytime?** Yes.
7. **Why Expo Go isn’t enough?** Real GGUF needs `llama.rn` in a native binary.
8. **Will the app fake answers?** No — mock is labeled; missing runtime errors instead of inventing text.
9. **Why won’t image generation produce pictures?** No linked diffusion runtime — it refuses fake pixels.
10. **Is vision fully multimodal?** Not as production pixel multimodal; gated/prompt-assisted.
11. **How do I export a document?** Workspace editor → export formats → share sheet.
12. **Which exports are supported?** DOCX, PDF, PPTX, XLSX, CSV, MD, HTML, TXT, JSON, SVG.
13. **Where are files stored?** On-device app sandbox; browse in Files.
14. **What permissions are needed?** Internet for downloads; mic/camera/photos only for speech/vision/OCR.
15. **Is there telemetry?** No analytics SDK bundled.
16. **Are there ads?** No ads SDK at launch.
17. **How do updates for models work?** Optional catalog check + reinstall with rollback.
18. **What is Wi‑Fi-only downloads?** Optional Setting (default **off**). When on, model downloads require Wi‑Fi; when off, Wi‑Fi **or** mobile data works.
19. **What is Offline mode in Settings?** Blocks network features when enabled.
20. **How do I report a bug?** Settings → Report Issue (email compose).
21. **Where is the Privacy Policy?** In-app Legal; web URL must be published for Play.
22. **minSdk?** Android 8.0 (API 26).
23. **targetSdk?** 35. **compileSdk?** 36.
24. **New Architecture?** Enabled in `app.json`.
25. **Can I use ONNX today?** Adapter exists but reports unavailable.
26. **Does `src/hooks` contain hooks?** Directory is reserved/empty; see `workspace/hooks`.
27. **Is `android/` required in git?** No — regenerate with prebuild.
28. **How do I regenerate icons?** Edit SVGs in `assets/brand/`, run `npm run export:brand`.
29. **Why separate scores?** So external gaps aren’t hidden in one number. Current: Repository **100%** (project scope); Play still **NOT READY**. Phase 14’s older split scores remain historical in the Roadmap.
30. **When can we submit to Play?** After blockers in `FINAL_RELEASE_CHECKLIST.md` are PASS.
31. **Is iOS supported?** Prebuild/run supported; Android is primary Play target.
32. **Does PocketBrain include RAG?** Not yet — roadmap only.
33. **Plugins/agents?** Roadmap only.
34. **Subscriptions/ads later?** Possible later; not in current binary.
35. **Cloud sync?** Not implemented; architecture remains offline-first.
36. **How is download integrity checked?** SHA-256 when catalog provides hash.
37. **What if update fails?** Backup restore path in ModelManager.
38. **TalkBack ready?** Partial labels; full matrix not device-verified.
39. **Tablet layouts?** Usable; not specially optimized.
40. **Which Node version?** Modern LTS; match CI/dev machine used for `npm test`.
41. **Why Buffer polyfill?** Office exporters expect Node Buffer APIs.
42. **Can I clear cache?** Storage screen tools + OS app storage clear.
43. **Model licenses?** Shown per listing; user must comply.
44. **Support website?** `pocketbrain.app` configured; ensure routes are live before Play.
45. **Who maintains brand guidelines?** [`assets/brand/BRAND_GUIDELINES.md`](assets/brand/BRAND_GUIDELINES.md).

---

## 22. Known limitations

Honest list (also [`release/KNOWN_LIMITATIONS.md`](release/KNOWN_LIMITATIONS.md)):

1. Live Privacy/Terms URLs return 200 via redirect to a marketing SPA **without readable policy HTML** (drafts in `store/legal/` not published as static policy pages)
2. No physical-device RC matrix completed in Final Verification
3. Production AAB requires upload credentials (signing is **fail-closed** in-repo — release will not silently use debug signing)
4. Play screenshots not captured (templates only)
5. Real GGUF requires native `llama.rn` build
6. Vision / image generation gated; video deferred
7. Performance/TalkBack not hardware-verified
8. English UI only (i18n scaffolding exists)
9. Primary navigation is 5 tabs (Home / Get / Chat / Mine / Settings); extra tools via Settings
10. `expo-system-ui` recommended by prebuild for `userInterfaceStyle` (optional polish)
11. RAG / plugins / agents / cloud sync / ads / subscriptions — future only

---

## 23. Roadmap

### Phase history (high level)

| Phase | Theme |
| --- | --- |
| 1–5 | Core app, Workspace, multimodal foundations, feature-complete UX |
| 6 | `llama.rn` packaging, honesty gates, discovery/update polish |
| 7–8 | Validation packaging, brand PNGs, compliance |
| 9 | Play Console simulation docs |
| 10 | SVG brand system + launch readiness docs |
| Final Verification | Evidence audit → **67%** / **NOT READY** |
| Independent Production Audit | Stricter re-audit → **62%** / **NOT READY** |
| Phase 11 packaging | Repo blockers cleared → **68%** / still **NOT READY** |
| Phase 12 RC | Verify automation + RC pack → **75%** (feature rubric) |
| Phase 13 Deployment RC | Runbook + submission guide |
| Phase 14 Production Validation | Freeze + handoff; scores Repo **98%** / Play **38%** / still **NOT READY** ([`FINAL_RELEASE_DECISION.md`](release/FINAL_RELEASE_DECISION.md)) |
| Phase 15 Engineering Excellence | Quality/perf/security/a11y hardening; engineering reports — still **NOT READY** for Play ([`ENGINEERING_REVIEW.md`](release/ENGINEERING_REVIEW.md)) |
| Phase 16 Independent Production Audit | Skeptical release gate — **🟡 Ready for Release Engineering**; Play tracks still **NOT READY** ([`RELEASE_GATE_REPORT.md`](release/RELEASE_GATE_REPORT.md)) |
| Phase 17 Release Engineer Finalization | Repo-controlled risks closed; **🟡 Ready for External Validation** ([`FINAL_RELEASE_HANDOFF.md`](release/FINAL_RELEASE_HANDOFF.md)) |
| Phase 18 External Validation Playbook | Operational guides to Internal Testing — **no code**; repo development complete ([`FINAL_EXECUTION_CHECKLIST.md`](release/FINAL_EXECUTION_CHECKLIST.md)) |

### Future (do not implement until prioritized)

- Local RAG over user documents
- Plugin ecosystem / AI workflows / agents
- Optional cloud sync
- Optional subscriptions / ads
- Experimental video generation
- Full multimodal vision + on-device diffusion

Version table: [`release/VERSION_HISTORY.md`](release/VERSION_HISTORY.md).

---

## 24. Contributing

### Coding style

- TypeScript strict
- Match existing Paper/MD3 patterns and teal brand tokens in `src/theme`
- Prefer fixing honesty gates over fabricating capabilities
- No new analytics/backend SDKs without an explicit product decision + Data Safety update

### Folder conventions

- Screens under `src/app/screens/<Feature>/`
- Cross-cutting services under `src/services/`
- Inference adapters under `src/inference/adapters/`
- Do not put Play legal HTML inside `src/` — use `store/legal/`

### Git

- Prefer focused commits
- When changing version: update `package.json`, `app.json`, README (`App version: **x.y.z**`), `store/play/LISTING.md`, `store/play/RELEASE_NOTES.md` together so `npm run verify:release` passes
- Do not commit secrets, keystores, or fabricated screenshots

### Testing requirements

Before opening a PR that touches release surfaces:

```bash
npm run lint && npm run test && npm run verify:release
```

---

## 25. Changelog

### 1.9.3 — Phase 17 + local UX polish

- Release engineer finalization: repo-controlled risk closure + handoff pack
- End-user UX: 5 primary tabs; Home first-model CTA; simpler model cards; Chat empty CTAs
- Downloads: Wi‑Fi **or** mobile data by default; Marketplace Small/Medium/Large + expanded catalog
- Android `compileSdk` 36 (targetSdk remains 35); `expo-av` removed (mic via platform permissions)
- Play still **NOT READY** (external)

### 1.9.2 — Phase 15

- Engineering excellence: shared helpers, list perf, a11y labels, error-path clarity
- Reports under `release/ENGINEERING_REVIEW.md` (+ performance/security/dependency/test)
- Play still **NOT READY** (external)

### 1.9.1 — Phase 14

- Freeze, Play rehearsal, production handoff; four separate scores
- Play still **NOT READY**

### 1.9.0 — Phase 13

- Deployment RC docs; verify EXTERNAL labeling; freeze rules
- Readiness overall **69%**; Play still **NOT READY**

### 1.8.0 — Phase 12

- Verify automation suite; RC + external dependency reports; a11y polish
- Completion **75%**; Play still **NOT READY**

### 1.7.0 — Phase 11

- Release signing plugin, legal HTML pack, QA/screenshot/Play guides
- Completion **68%**; Play decision still **NOT READY** (external gates)

### 1.6.1 — Final Verification

- Lint script, `eas.json`, Babel resolution, Android export verified
- Production-category completion later tightened to **62%** (independent audit); Play decision **NOT READY**

### 1.6.0 — Phase 10

- SVG brand system, brand guidelines, empty-state polish, final release audit docs

### 1.5.1 — Phase 9

- Play Console submission documentation pack

### 1.5.0 — Phase 8

- Brand packaging, compliance hardening (`allowBackup`, targetSdk 35)

### 1.4.x — Phases 6–7

- `llama.rn` packaging, validation packaging

### 1.3.0 — Phase 5

- Feature-complete UX (gates, Files, Download Center, response actions)

Full notes: [`release/CHANGELOG.md`](release/CHANGELOG.md), [`store/play/RELEASE_NOTES.md`](store/play/RELEASE_NOTES.md).

---

## 26. License

This repository includes an **MIT** license file. The checked-in [`LICENSE`](LICENSE) text currently carries the Expo template copyright header (`650 Industries, Inc.`). Treat third-party packages and downloaded model weights under **their own licenses**. In-app license screens summarize major components.

---

## 27. Contact

| Channel | Value |
| --- | --- |
| Support email | `support@pocketbrain.app` |
| Privacy / Terms (configured) | `https://pocketbrain.app/privacy`, `https://pocketbrain.app/terms` |
| Hostable legal drafts | [`store/legal/`](store/legal/) |
| Brand | [`assets/brand/`](assets/brand/) |
| Release / Play docs | [`release/`](release/) |

---

## Release Readiness Report

**Decision:** ❌ **NOT READY** for Internal, Closed, Open, or Production Play tracks.

Authoritative decision: [`release/FINAL_RELEASE_DECISION.md`](release/FINAL_RELEASE_DECISION.md) (Phase 14). Also [`PRODUCTION_HANDOFF.md`](release/PRODUCTION_HANDOFF.md), [`REPOSITORY_FREEZE.md`](release/REPOSITORY_FREEZE.md), [`PLAYSTORE_REHEARSAL.md`](release/PLAYSTORE_REHEARSAL.md), [`EXTERNAL_DEPENDENCIES.md`](release/EXTERNAL_DEPENDENCIES.md).

### Verified automation

| Check | Result |
| --- | --- |
| `npm run lint` / `typecheck` | PASS |
| `npm test` | PASS (see current suite) |
| `npm run verify:release` | PASS |
| `npx expo prebuild -p android` | Re-run after Phase 11 signing plugin |
| `npx expo export -p android` | PASS historically (1882 modules) |
| Device UI / GGUF | NOT RUN / **UNVERIFIED** |
| Privacy/Terms URL content | **EXTERNAL** — HTML ready in `store/legal/`; live deploy pending |
| Release signing config | **RESOLVED (repo)** — fail-closed plugin; credentials EXTERNAL |
| Signed AAB | **EXTERNAL** (not produced) |
| Phone screenshots | **EXTERNAL** (guide only; 0 PNGs) |

### Final certificate

Repository development is **complete**. Authoritative pack: [`FINAL_RELEASE_CERTIFICATION.md`](release/FINAL_RELEASE_CERTIFICATION.md), [`FINAL_EXTERNAL_ACTIONS.md`](release/FINAL_EXTERNAL_ACTIONS.md). Remaining work is external only.

### Phase 18 note

Phase 18 is an **external execution playbook** only (hosting, signing, device QA, screenshots, Play Console). No repository feature work. Start at [`release/EXTERNAL_VALIDATION_PLAN.md`](release/EXTERNAL_VALIDATION_PLAN.md) / [`FINAL_EXECUTION_CHECKLIST.md`](release/FINAL_EXECUTION_CHECKLIST.md).

### Phase 17 note

Phase 17 closes repository-controlled Phase 16 risks (download cleanup, Vision honesty, doc sync, integrity documentation). Authoritative handoff: [`release/FINAL_RELEASE_HANDOFF.md`](release/FINAL_RELEASE_HANDOFF.md). Remaining blockers are external or hardware. Play tracks remain **NOT READY**.

### Phase 16 note

Phase 16 is an independent production audit / release gate (no features). Authoritative decision: [`release/RELEASE_GATE_REPORT.md`](release/RELEASE_GATE_REPORT.md). Live Privacy/Terms URLs were probed and found to serve the wrong content (SPA shell). Play tracks remain **NOT READY**.

### Phase 15 note

Phase 15 is engineering excellence only (quality, performance knobs, security hardening, a11y, tests/reports). No new user-facing features. Play tracks remain **NOT READY** until external Critical items clear. See [`release/ENGINEERING_REVIEW.md`](release/ENGINEERING_REVIEW.md).

### Phase 14 note

Phase 14 freezes features and packages production validation/handoff. Play tracks remain **NOT READY** until external Critical items clear.

### Phase 13 note

Phase 13 is the Deployment RC: Play submission guide, deployment runbook, readiness matrix, risk assessment, and freeze rules. Play tracks remain **NOT READY** until external Critical items clear.

### Phase 12 note

Phase 12 added verify automation, RC/external reports, and a11y micro-polish. Play tracks remain blocked on external Critical items.

### Phase 11 note

Phase 11 cleared repository-solvable release blockers (signing config, legal HTML, guides). External hosting/device/AAB remain.

### Phase 10 note

Phase 10 delivered the editable SVG brand system and launch packaging docs. It did **not** clear Play upload blockers.

---

## Project Completion Assessment

Phase 14 reports **four separate scores** (not one optimistic blend). Full detail: [`release/FINAL_COMPLETION_REPORT.md`](release/FINAL_COMPLETION_REPORT.md). Phase 15 improved engineering quality without changing those external-gated scores.

| Score type | Value |
| --- | ---: |
| Repository Completion | **100%** (project scope) |
| Production Validation | Awaiting external execution |
| External Readiness | Legal hosting / signing / device QA / screenshots / Play |
| Google Play Readiness | **NOT READY** |


App version: **1.9.3** (Android `versionCode` 16).

Devices tested: local emulator + sideload APK path used for development; formal RC matrix still open. Signed **Play** AAB: **not produced**. Do not claim Play readiness until Critical blockers in [`release/FINAL_BLOCKERS.md`](release/FINAL_BLOCKERS.md) / [`release/FINAL_RELEASE_CERTIFICATION.md`](release/FINAL_RELEASE_CERTIFICATION.md) are cleared.
