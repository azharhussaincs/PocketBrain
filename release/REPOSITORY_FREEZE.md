# REPOSITORY_FREEZE.md

**Effective:** Phase 14 — Production Validation  
**Version at freeze:** **1.9.3** / Android `versionCode` **16** (feature freeze continues)  
**Status:** Repository is under **release freeze** for feature development.

This freeze does **not** mean Play submission is complete. It means in-repo product scope is locked while external validation proceeds.

---

## Frozen modules (do not change without release-manager exception)

| Area | Paths (indicative) |
| --- | --- |
| Inference / honesty gates | `src/inference/`, `src/services/AIService.ts`, adapters |
| Multimodal capability policy | `src/ai/**` (OCR/STT/TTS/vision/image) |
| Marketplace catalog schema | `src/data/catalog.ts`, discovery filters behavior |
| Navigation IA / tabs | `src/app/navigation/RootNavigator.tsx` (no new tabs/features) |
| Workspace exporters contract | `src/workspace/exporters/**` (no new formats unless bugfix) |
| Monetization / privacy architecture | `src/monetization/`, no analytics/backend SDKs |
| Core product screens (feature work) | `src/app/screens/**` feature additions |

---

## Allowed changes before / during launch

| Category | Examples |
| --- | --- |
| Critical bug fixes | Crash on launch, broken install path, data loss |
| Release signing | EAS credentials, local `PB_UPLOAD_*`, never commit secrets |
| Legal URLs / HTML | `store/legal/*`, `app.json` `extra` URLs after hosting |
| Screenshots | Real captures only under `assets/play/screenshots/` |
| Play metadata | `store/play/LISTING.md`, release notes, Console paste sync |
| Accessibility fixes | Labels, touch targets, TalkBack regressions |
| Performance fixes | List virtualization, OOM guards, ANR mitigations |
| Security fixes | Dependency CVEs, permission tightening, secret leaks |
| VersionCode bumps | Required for each Play upload |
| Docs / verify scripts | Handoff, rehearsal, freeze, matrix accuracy |

---

## Prohibited before first Production submission

- New AI capabilities, RAG, agents, plugins, cloud sync  
- Ads / IAP / subscriptions / analytics SDKs  
- UI redesigns, tab restructuring, new major screens  
- Experimental runtimes (ONNX/diffusion) wired as “ready”  
- Fabricated screenshots, fake device PASS, fake live legal URLs  
- Dependency major upgrades unrelated to security  

---

## Exception process

1. Document defect ID + severity (P0/P1).  
2. Minimal patch only.  
3. Re-run `npm run lint && npm test && npm run verify:all`.  
4. Note change in `CHANGELOG.md` / release notes.  
5. If behavior user-visible, re-run affected Device QA rows.

---

## Statement

**Every repository-controlled blocker identified through Phase 13 has been addressed or documented as external.** Phase 14 focuses on validation packaging and handoff quality—not new development.
