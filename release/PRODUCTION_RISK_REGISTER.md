# Production Risk Register — Phase 16

**Date:** 2026-07-30  
**App:** PocketBrain **1.9.2** / `versionCode` **15**  
**Classification rule:** Severity assigned only from repository (and live URL probe) evidence.

---

## Critical

| ID | Risk | Evidence | Impact if ignored |
| --- | --- | --- | --- |
| R-C1 | Live Privacy/Terms URLs serve wrong content (SPA for “runinbrowser-ai”, not `store/legal` HTML) | `curl -sL https://pocketbrain.app/privacy` → 307 → `pocketbrain.chat/privacy` → SPA `index.html`; same pattern for `/terms`; `app.json` `extra.privacyPolicyUrl` | Play policy rejection; deceptive privacy disclosure |
| R-C2 | No phone screenshots for listing | `assets/play/screenshots/` README only; verify:assets WARN | Cannot complete Production listing |
| R-C3 | No signed production AAB / no credentials in environment | `verify:build` SKIP; no `keystore.properties` | Cannot upload to any Play track |
| R-C4 | No device QA evidence | README “Devices tested: none”; checklist blank | Unknown crash/OOM/ANR rates |
| R-C5 | Download integrity never enforced (no catalog `sha256`) | `src/data/catalog.ts` zero `sha256`; verify only if `expectedSha256` set | Corrupt/tampered weights install as “installed” |

---

## High

| ID | Risk | Evidence | Impact |
| --- | --- | --- | --- |
| R-H1 | Vision feature does not feed image pixels to llama.rn | `VisionService` prompt includes `Image URI: …`; adapter is text completion | Misleading vision results / policy honesty issues |
| R-H2 | SHA verify / update backup loads full file bytes | `DownloadManager.verifyFileSha256` → `file.bytes()`; `ModelManager.updateOrReinstall` copies bytes; Phi-3.5 ~2.3 GB in catalog | OOM on mid-range devices if checksums/updates used |
| R-H3 | Inference trusts installed metadata without file existence check | `AIService` uses `modelManager.get` + `filePath`; no pre-load `exists` | Native crash or hard failure on missing file |
| R-H4 | Stale release docs contradict current version/signing | `FINAL_STATUS.md` “debug signing”; many docs at 1.9.1/14; PRE_SUBMISSION was 12 (corrected this audit) | Wrong Console version / mistaken signing assumptions |
| R-H5 | Catalog advertises vision models while runtime path is text-URI | `catalog.ts` SmolVLM capabilities include `vision` | Store/user expectation mismatch |

---

## Medium

| ID | Risk | Evidence | Impact |
| --- | --- | --- | --- |
| R-M1 | Cancel leaves partial download files | `DownloadManager.cancel` — no delete | Storage waste / confusing retries |
| R-M2 | Pause-after-process-death resume correctness | Hydrate maps active→paused; pauseState may be missing | Restart/partial behavior Not Verified |
| R-M3 | Enqueue does not re-check free disk | Compatibility checked in UI/registry; race possible | Mid-download ENOSPC |
| R-M4 | Raw `error.message` may surface native paths | Chat / `formatNetworkDownloadError` fallback | Minor info leakage in Alerts |
| R-M5 | `DATA_SAFETY.md` version header 1.5.1 | Header line | Console form drift |
| R-M6 | Accessibility TalkBack matrix not executed | `ACCESSIBILITY_REVIEW.md` | Policy/a11y findings unknown |
| R-M7 | `expo-speech-recognition` major pin ^56 vs Expo 57 | `package.json` | Runtime skew Not Verified |
| R-M8 | Hardware RAM gate is heuristic (50% totalMemory) | `HardwareService.canInstallModel` | Over/under-block installs |

---

## Low

| ID | Risk | Evidence | Impact |
| --- | --- | --- | --- |
| R-L1 | Empty placeholder directories | `src/hooks/`, `src/ai/runtime/` | Maintainability noise |
| R-L2 | Export share unavailable throws (file still written) | `ExportService.exportAndShare` | UX friction; Alert path exists |
| R-L3 | Historical FINAL_* scoreboards confuse operators | Many `release/FINAL_*.md` | Process error, not runtime crash |

---

## Accepted / mitigated (do not escalate)

| Item | Evidence |
| --- | --- |
| Corrupt download queue reset | `DownloadManager.hydrate` clears + removes AsyncStorage key |
| Wi‑Fi-only / offline download errors | `assertNetworkAllowed` |
| Image generation refuses fake pixels | `ImageGenerationService` |
| Expo Go mock limited when model “installed” | `AIService` honesty gate |
| Release signing fail-closed | Gradle + plugin |
| `allowBackup: false` | app.json + manifest |

---

## Risk → track mapping

| Before Internal | Must address |
| --- | --- |
| Critical hosting (R-C1) | Deploy correct static legal HTML |
| Critical AAB (R-C3) | Credentials + signed build |
| Critical device smoke (R-C4) | P0 QA on physical device |
| High Vision (R-H1/H5) | Document limitation in listing / gate UI / or fix before claiming vision |

| Before Production | Additionally |
| --- | --- |
| Screenshots (R-C2) | ≥2 real phone captures |
| Integrity (R-C5) | Supply real checksums when available — never invent |
| Memory (R-H2) | Profile large models; consider streaming digest later |
| Docs (R-H4/M5) | Operators use Phase 16 gate as source of truth |
