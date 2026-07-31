# Play Store Submission Pack — PocketBrain

**App:** PocketBrain  
**Package:** `com.pocketbrain.app`  
**Version name:** 1.5.1  
**Version code:** 8  
**Prepared:** 2026-07-30 (Phase 9)  
**Source of truth:** `/README.md` + this `/release` folder  

## Final release decision (Phase 9)

| Track | Decision |
| --- | --- |
| Internal Testing | **NOT READY** — blockers remain (see below) |
| Closed / Open Testing | **NOT READY** |
| Production Release | **NOT READY** |

### Blockers before any Play track upload

1. **Privacy Policy URL live HTTPS 200** — `https://pocketbrain.app/privacy` currently **404** (verified 2026-07-30). Host `store/legal/privacy.html`.
2. **Terms URL live HTTPS 200** — `https://pocketbrain.app/terms` currently **404**. Host `store/legal/terms.html`.
3. **Production signing** — release must not use the debug keystore (`APP_SIGNING.md`).
4. **Signed release AAB installed on a physical device** with RC checklist recorded PASS (`TEST_REPORT.md`).
5. **≥2 real phone screenshots** captured from that binary (`assets/play/screenshots/` — capture plan only; no fabricated images).

Do **not** submit placeholder screenshots or claim legal pages are live.

---

## App Details

| Field | Answer |
| --- | --- |
| App name | PocketBrain |
| Package name | com.pocketbrain.app |
| App or game | **App** |
| Free or paid | **Free** |
| Contains ads | **No** |
| In-app products | **No** (launch) |
| Category | **Productivity** |
| Tags (suggested) | Productivity, Tools, AI (only if Console allows and accurate) |
| Default language | English (en-US) |
| Contact email | support@pocketbrain.app |
| Website | https://pocketbrain.app (verify live; legal routes currently 404) |
| Privacy Policy URL | https://pocketbrain.app/privacy — **BLOCKER until live** |
| Terms URL | https://pocketbrain.app/terms — **BLOCKER until live** |

---

## Store Listing

### Short description (≤80 characters)

```
Offline AI on your phone. Local models, private chat, docs. No account required.
```

Character count: 80.

### Long description (≤4000 characters)

```
PocketBrain is an offline-first AI operating system for Android.

Download open-source models to your phone and run them locally whenever your device and the selected runtime support on-device inference. Chat privately, create documents in Workspace, and manage files — without sending your prompts to proprietary cloud AI APIs by default.

What you can do
• Choose a task on Home — Write, Study, Coding, Speech, and more
• Browse the Marketplace with plain-language cards (size, RAM, license, offline)
• Install multiple models, switch anytime, update, or delete to free space
• Copy, share, save, and export AI responses
• Create and export documents (DOCX, PDF, PPTX, XLSX, and more)
• Manage Downloads, Files, and Storage entirely on-device
• Read Privacy, Terms, FAQ, and open-source licenses inside the app

Privacy by design
• No account required
• No ads SDK
• No analytics SDK at launch
• Internet is used when you download models or open links you choose
• Microphone, camera, and photos are requested only when you start those features

Honest limitations
• Real GGUF text inference requires a supported native build with the on-device runtime
• Vision is **limited** in this release (no image-pixel load into GGUF; outputs labeled Limited Vision). Image generation stays capability-gated — PocketBrain will not invent fake results
• Always review each model’s license before download

Get started: install PocketBrain, pick a task, download a recommended model, and keep your AI in your pocket.

Support: support@pocketbrain.app
Privacy: https://pocketbrain.app/privacy
Terms: https://pocketbrain.app/terms
```

### Prioritized ASO keywords

1. offline ai  
2. on-device llm  
3. local ai  
4. private ai chat  
5. gguf  
6. offline chatbot  
7. no account ai  
8. privacy ai  
9. document ai  
10. android local models  
11. workspace docs  
12. open source models  
13. speech to text offline  
14. ocr on device  
15. llama android  

Avoid keyword stuffing in the long description; use natural phrases only.

### Graphic assets status

| Asset | Path | Status |
| --- | --- | --- |
| High-res icon 512×512 | `assets/play/icon-512.png` | **READY** (512×512 verified) |
| Feature graphic 1024×500 | `assets/play/feature-graphic.png` | **READY** (1024×500 verified) |
| Adaptive / mono / splash | `assets/` + `assets/brand/` | **READY** |
| Notification icon | `assets/notification-icon.png` | **READY** |
| Phone screenshots | `assets/play/screenshots/` | **BLOCKED** — capture plan only |
| Tablet screenshots | — | Optional unless tablet listing enabled |

---

## App Content

| Question | Recommended answer |
| --- | --- |
| Privacy policy | Required URL — must be live before submit |
| Ads | No |
| Target audience | Adults 18+ primary; not designed for children |
| Families / Designed for Families | **No** — do not enroll |
| News app | **No** |
| COVID / public health | **No** |
| Government apps | **No** |
| Financial features | **No** |
| Health features | **No** (AI outputs are not medical advice; disclaimer in-app) |
| Data safety | See `DATA_SAFETY.md` |
| Content rating | See `CONTENT_RATING.md` |
| App access | All features available without login — **no demo account** |
| Advertising ID | **No** — no ads SDK; do not declare Ad ID usage |
| Government affiliation | None |
| Export compliance | Standard Android encryption only; no custom crypto export beyond platform defaults — answer Console prompts accordingly |

### AI-generated content / generative AI disclosure

- App can produce AI text **on-device** after the user installs a model.
- Disclose in Console if asked that the app includes generative AI features.
- Content is **user-initiated**, not a social feed.
- In-app AI disclaimer present (Settings → Legal).
- Do **not** claim unrestricted multimodal image generation if runtime is gated.

---

## Data Safety

See `DATA_SAFETY.md` — must match Console form exactly.

Summary: **no data collected by PocketBrain servers**; local processing; user-initiated model downloads to third-party hosts; no ads/analytics SDKs.

---

## Privacy

| Item | Status |
| --- | --- |
| In-app Privacy Policy | Present |
| In-app Terms | Present |
| In-app AI disclaimer | Present |
| Web Privacy URL | **FAIL — 404** |
| Web Terms URL | **FAIL — 404** |
| Support email | Configured `support@pocketbrain.app` (inbox deliverability not verified in this session) |
| Contact HTML draft | `store/legal/contact.html` |

---

## Ads

**No ads.** No ad SDK. No AdMob / Meta Audience Network / etc. Declare **No** ads. Advertising ID: **No**.

---

## AI Features (truthful)

| Feature | Ship claim |
| --- | --- |
| Local text chat (GGUF via llama.rn) | Supported in **native** builds after model install; not Expo Go |
| Multi-model install/switch/delete | Yes |
| Workspace docs + export | Yes (code); device share QA still required |
| TTS | OS TTS |
| STT / OCR | Native build + runtime permissions |
| Vision | Limited — no pixel multimodal path; do not market as full image understanding |
| Image generation | Gated — never invents pixels |
| Video generation | Not available (roadmap) |

---

## Permissions

See `PERMISSIONS.md`.

---

## Security

| Topic | Status |
| --- | --- |
| allowBackup | false (app.json) |
| Cleartext | Debug manifests only — must not ship in release |
| SYSTEM_ALERT_WINDOW | Blocked |
| Release signing | **BLOCKER** until upload keystore / EAS |
| Network | HTTPS for downloads/links; no PocketBrain backend |
| Model integrity | SHA-256 when catalog provides hash |

---

## Release

| Item | Value |
| --- | --- |
| versionName | 1.5.1 |
| versionCode | 8 |
| minSdk | 26 |
| targetSdk | 35 |
| Artifact | AAB (`bundleRelease` / EAS production) |
| First track after blockers | Internal testing |
| Production | Only after Internal PASS + policy review |

---

## Review Notes

See `REVIEW_NOTES.md` (paste into Play Console “notes for reviewers”).

---

## Consistency rule

Every Console answer, screenshot, URL, permission declaration, and listing sentence must match actual app behavior. If unverified → mark **BLOCKED**, do not guess.
