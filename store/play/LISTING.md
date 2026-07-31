# Google Play listing metadata

Update these before store submission. Keep them truthful and aligned with Privacy Policy.

## Short description (≤80 characters)

Offline AI on your phone. Local models, private chat, docs. No account required.

## Full description

PocketBrain is an offline-first AI operating system for Android.

Download open-source models to your device and run them locally whenever your hardware and the selected runtime support on-device inference. Chat privately, create documents in Workspace, and manage files — without sending your prompts to proprietary cloud AI APIs by default.

What you can do:
• Pick a task on Home — Write, Study, Coding, Speech, and more
• Browse the Marketplace with plain-language model cards (size, RAM, license, offline)
• Install multiple models, switch anytime, update, or delete to free space
• Copy, share, save, and export AI responses
• Use Workspace exporters (DOCX, PDF, PPTX, XLSX, and more)
• Manage Downloads, Files, and Storage on-device
• Review Privacy, Terms, FAQ, and licenses inside the app

Privacy by design:
• No account required
• No ads SDK
• No analytics SDK at launch
• Internet used when you download models or open links you choose
• Microphone, camera, and photos requested only when you start those features

Important honesty notes:
• Real GGUF text models need a supported native build (not Expo Go)
• Image Understanding / Vision is limited in this release: PocketBrain does not load image pixels into the GGUF runtime yet (results are labeled Limited Vision). Prefer on-device OCR for reading text in photos
• Image generation remains capability-gated until a compatible diffusion runtime and model are available — PocketBrain will not invent fake results
• Always review each model’s license before download

Support: support@pocketbrain.app
Privacy: https://pocketbrain.app/privacy
Terms: https://pocketbrain.app/terms

## Keywords (ASO)

offline ai, on-device llm, local ai, private chatgpt alternative, gguf, llama, privacy ai, offline chatbot, document ai, workspace, ocr, speech to text, no account ai, open source models, android ai

## Category

Productivity

## Content rating

Prepare IARC questionnaire for a productivity tool without social UGC feeds. Keep the AI disclaimer visible in-app.

## Assets checklist

- [x] App icon (`assets/icon.png`)
- [x] Adaptive icon layers
- [x] Splash screen
- [x] Feature graphic 1024×500 (`assets/play/feature-graphic.png`)
- [x] High-res icon 512×512 (`assets/play/icon-512.png`)
- [x] Phone screenshots (min 2) — `store/play/screenshots/phone/` (device captures)
- [ ] Tablet screenshots if tablet listing enabled

## Legal hosting status

- Configured URLs: `https://pocketbrain.app/privacy`, `https://pocketbrain.app/terms`
- Repo HTML ready (`store/legal/`). Live deploy still required — see `store/legal/HOSTING.md`. Do not claim URLs are compliant until `curl -sL` shows policy body text.
- Publish-ready HTML: `store/legal/privacy.html`, `store/legal/terms.html`
- One-click static pack: `store/legal/site/` (`vercel.json` / `netlify.toml`)

## Versioning

- Marketing version: `expo.version` in app.json (currently 1.0.1)
- Android `versionCode`: 18 (increment on every Play upload)
- Keep release notes in Play Console and `store/play/RELEASE_NOTES.md`
