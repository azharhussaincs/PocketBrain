# Notes for Google Play reviewers

App: **PocketBrain** (`com.pocketbrain.app`)  
Version: **1.5.1** (versionCode **8**)

## How to test without an account

PocketBrain requires **no login**. All core flows are available after install.

Suggested path:
1. Launch app → complete onboarding consent (Privacy, Terms, AI disclaimer).
2. Home → pick a simple task (e.g. Write / Chat).
3. Download a **small starter** model over Wi‑Fi (large downloads; Wi‑Fi recommended).
4. Open Chat and send a short prompt (native build with on-device runtime).
5. Optional: Workspace → create a short document → export.
6. Settings → Privacy / Legal to review policies offline.

## Permissions

Microphone, camera, and photos are requested **only** when the user starts Speech / Vision / OCR — not at cold start. Denying them disables those features only.

## Network

No PocketBrain backend. Network is used for user-initiated model downloads and user-tapped links.

## Generative AI

On-device text generation after the user installs a model. Outputs may be inaccurate; disclaimer is in-app. Vision/image generation are capability-gated and do not fabricate results.

## Ads / purchases

No ads SDK. No in-app purchases in this release.

## Build note

Please test a **release** AAB/APK with the native on-device runtime. Expo Go is a development environment and uses a labeled mock path — it is not the production binary.
