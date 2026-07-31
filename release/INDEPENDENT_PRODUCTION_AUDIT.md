# Independent Production Audit — PocketBrain Phase 16

**Auditor role:** Independent Google Play release auditor (skeptical; evidence-only)  
**Date:** 2026-07-30  
**Subject:** PocketBrain **1.9.2** / Android `versionCode` **15** · package `com.pocketbrain.app` · Expo SDK 57  
**Method:** Repository inspection + `npm run lint` + `npm test` (45/45) + `npm run verify:all` + live HTTP probe of configured Privacy/Terms URLs  
**Rule:** Absence of evidence = **Not Verified**, never Passed.

---

## Executive verdict

| Question | Answer |
| --- | --- |
| Ready for Google Play Production? | **No** |
| Ready for any Play testing track today? | **No** |
| Repository-controlled Critical code defects blocking builds? | **None found that fail `verify:all` / TypeScript** |
| Repository-controlled defects that can still harm a release? | **Yes** — stale/conflicting release docs; catalog integrity never enforced; Vision path does not consume image pixels |
| Dominant blockers | **External** — wrong live legal content, no signed AAB, no device QA, no screenshots, no Console |

**Authoritative gate for this phase:** [`RELEASE_GATE_REPORT.md`](RELEASE_GATE_REPORT.md)

---

## STEP 1 — Repository integrity

### Verified consistent

| Check | Evidence | Status |
| --- | --- | --- |
| Version sync | `package.json`, `app.json`, `android/app/build.gradle`, README, `store/play/LISTING.md`, `store/play/RELEASE_NOTES.md` all **1.9.2 / 15** | ✅ Verified |
| TypeScript | `npm run lint` (`tsc --noEmit`) exit 0 | ✅ Verified |
| Automated tests | `npm test` **45/45** | ✅ Verified |
| Verify suite | `npm run verify:all` — PASS with WARN (screenshots) + SKIP (credentials) | ✅ Verified (suite) |
| Signing plugin | `plugins/withAndroidReleaseSigning.js` registered; Gradle release fail-closed | ✅ Verified |
| Dead unused ModelCard | Removed (Phase 15); FriendlyModelCard in use | ✅ Verified |
| Empty placeholder dirs | `src/hooks/`, `src/ai/runtime/` empty | ⚠ Residual clutter (documented) |

### Defects found

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| DOC-1 | **High** | Multiple Phase 13/14 “authoritative” docs still claim **1.9.1 / 14** while the app is **1.9.2 / 15** | `EXTERNAL_DEPENDENCIES.md`, `FINAL_RELEASE_DECISION.md`, `PRODUCTION_HANDOFF.md`, `FINAL_BLOCKERS.md`, `release/RELEASE_NOTES.md`, others |
| DOC-2 | **High** | Historical `FINAL_STATUS.md` (1.6.1) still states **“release still signs with debug”** — **false** vs current Gradle fail-closed | `release/FINAL_STATUS.md` vs `android/app/build.gradle` |
| DOC-3 | **Medium** | `DATA_SAFETY.md` header still **Version covered: 1.5.1** | `release/DATA_SAFETY.md` |
| DOC-4 | **Medium** | `PRIVACY_CHECKLIST.md` previously claimed **404**; live probe shows **200 SPA shell** (corrected this audit to “wrong content”) | Live curl 2026-07-30; checklist updated |
| CODE-1 | **High** | Catalog has **zero** `sha256` fields → download integrity verify never executes | `src/data/catalog.ts` (no `sha256`); `DownloadManager.completeWithOptionalVerify` |
| CODE-2 | **High** | Vision “analyze” injects **Image URI string** into text completion; no pixel multimodal path in `LlamaCppAdapter` | `src/ai/vision/VisionService.ts`; catalog ships SmolVLM as `vision` |
| CODE-3 | **Medium** | `cancel()` does not delete partial download files | `DownloadManager.cancel` |
| CODE-4 | **Medium** | Load path trusts `installed` metadata; no existence check before inference | `AIService` + `ModelManager.get` |
| ASSET-1 | **Critical (Play)** | Zero phone screenshot PNGs | `assets/play/screenshots/` (README only) |

**Broken imports:** None detected by TypeScript.

**Broken links (live):** Configured Privacy/Terms URLs resolve but **do not serve** `store/legal/*.html` policy bodies.

---

## STEP 2 — Production risk summary

Full register: [`PRODUCTION_RISK_REGISTER.md`](PRODUCTION_RISK_REGISTER.md)

| Severity | Count (this audit) | Examples |
| --- | ---: | --- |
| Critical | 4 | Wrong live legal HTML; no screenshots; no signed AAB/device QA evidence; integrity never enforced for catalog downloads |
| High | 6 | Vision text-URI honesty; SHA/full-file RAM if checksums added; missing on-disk model check; stale release docs; update/reinstall memory copy |
| Medium | 8+ | Cancel leaves partials; pause-after-crash; raw error leakage; DATA_SAFETY version skew; a11y not device-run |
| Low / Info | several | Empty dirs; allowBackup false OK; signing fail-closed OK |

---

## STEP 3 — Security summary

| Topic | Finding | Status |
| --- | --- | --- |
| Secrets in git | No upload keystore / real `keystore.properties`; examples only under `credentials/` | ✅ Verified (absence) |
| Release signing | Fail-closed without credentials | ✅ Verified |
| allowBackup | `false` in app.json + manifest | ✅ Verified |
| Download SHA | Code path exists; **catalog never supplies hashes** | ❌ Failed (effective integrity) |
| Path sanitize | `sanitizeFileName` on model paths | ✅ Verified |
| Live policy URLs | SPA for unrelated “runinbrowser-ai” product; Umami analytics script on that SPA | ❌ Failed (hosting) |
| Dependency CVEs | No `npm audit` evidence captured in this audit | ⏳ Not Verified |

---

## STEP 4 — Google Play policy (repo evidence)

See [`PLAY_POLICY_AUDIT.md`](PLAY_POLICY_AUDIT.md).

**Cannot assume approval.** Repository has strong **draft** compliance artifacts; live Store requirements are **not** met.

---

## STEP 5 — Maintainability

| Dimension | Assessment |
| --- | --- |
| Organization | Strong modular layout (screens / services / inference / workspace / privacy / release scripts) |
| Build reproducibility | Good for unsigned/dev paths; signed AAB **Not Verified** without credentials |
| Documentation quality | **Overloaded** — many FINAL_* historical reports contradict current signing/version; Phase 16 gate must be preferred |
| Technical debt | Catalog integrity metadata; Vision honesty gap; cancel cleanup; doc archaeology |

---

## Mandatory questions (evidence-only)

1. **Is the repository internally consistent?**  
   **Mostly for code/build artifacts (1.9.2 sync, lint/test/verify).** **No** for the release-doc corpus (stale 1.9.1 / false debug-signing claims remain in older FINAL_* files).

2. **Are any repository-controlled blockers still present?**  
   **No Critical build/config blockers that fail verify.** **Yes** residual repo risks: no catalog SHA, Vision text-URI path, cancel partials, stale docs that can mis-instruct Console operators.

3. **Risks before Internal Testing?**  
   Correct legal hosting (real policy HTML), upload credentials, signed AAB, Play App Signing, P0 device smoke, Console Internal track setup.

4. **Risks before Closed Testing?**  
   All Internal risks + screenshot set preferred, broader device matrix, multimodal honesty validation (Vision), Data Safety/Content Rating forms.

5. **Risks before Production?**  
   All above + closed-test confidence, staged rollout, support mailbox proof, no deceptive listing/screenshots, integrity story for downloads.

6. **Repo evidence supporting Play compliance?**  
   Static legal HTML, in-app policies/disclaimer, DATA_SAFETY/PERMISSIONS drafts, minimal permissions, allowBackup false, honesty gates for image gen / Expo Go mock, listing copy that does not overclaim image generation.

7. **Repo evidence still missing?**  
   Device QA results, signed AAB artifact, real screenshots, proof live URLs serve `store/legal` HTML, catalog checksums, TalkBack matrix results, `npm audit` report.

8. **Physical device validation required?**  
   Cold/warm start, GGUF load/inference, download pause/resume/cancel, OCR/STT/camera permissions, export/share, low-RAM OOM, TalkBack, Marketplace install flow.

9. **Play Console actions required?**  
   App creation, Data Safety, Content Rating, audience/ads declarations, store listing, AAB upload, testing tracks, Play App Signing, privacy/terms URL fields.

10. **Approve handoff to a release engineer?**  
    **Yes** — with [`RELEASE_GATE_REPORT.md`](RELEASE_GATE_REPORT.md) and [`EXTERNAL_DEPENDENCIES.md`](EXTERNAL_DEPENDENCIES.md) as the working list. **Do not** treat handoff as Play approval.

---

## Completion percentages

This audit **does not increase** prior completion percentages. Prior README scores (Repo ~98% / Play ~38%) remain **external-gated** and must not be read as submission readiness.

---

## Gate decision (one)

# 🟡 Repository Ready for Release Engineering

**Not** ready for Google Play Submission or Production.  
**Not** ready for Internal Testing **today** (external Critical items incomplete; live legal content wrong).

Support: build/verify green; packaging mature; blockers are overwhelmingly external + residual integrity/honesty/doc risks documented above.
