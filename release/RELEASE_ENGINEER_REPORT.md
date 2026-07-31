# Release Engineer Report — Phase 17

**Date:** 2026-07-31  
**App:** PocketBrain **1.9.3** / Android `versionCode` **16**  
**Prior gate:** Phase 16 🟡 Repository Ready for Release Engineering  
**This phase:** Close repository-controlled risks; package handoff for external validation.

---

## Classification of Phase 16 findings

| ID | Finding | Class | Action |
| --- | --- | --- | --- |
| R-C1 | Live legal SPA shell | **External** | Documented; HOSTING.md + EXTERNAL E1 |
| R-C2 | No screenshots | **External / hardware** | Documented E6 |
| R-C3 | No signed AAB / credentials | **External** | Documented E2–E3 |
| R-C4 | No device QA | **Hardware** | Remains Not Verified |
| R-C5 | No catalog SHA256 | **Repo (justified)** | Mechanism ready; hashes left blank — see MODEL_INTEGRITY_REPORT |
| R-H1 / R-H5 | Vision honesty | **Repository** | **Fixed** — limited labeling in service, catalog, tasks, listing, Playground |
| R-H2 | Full-file SHA RAM | **Documented residual** | Streaming digest would be scope expansion; documented |
| R-H3 | Missing model file load | **Repository** | **Fixed** — `AIService` checks `File.exists` |
| R-H4 | Stale docs / debug signing claim | **Repository** | **Fixed** — version sync + FINAL_STATUS supersession banner |
| R-M1 | Cancel leaves partials | **Repository** | **Fixed** — delete on cancel/error |
| R-M3 | Enqueue no disk check | **Repository** | **Fixed** — `Paths.availableDiskSpace` pre-check |
| R-M5 | DATA_SAFETY version | **Repository** | Already synced in Phase 16/17 |
| R-M2, R-M6, R-M7, R-M8 | Pause-after-death, TalkBack, speech pin, RAM heuristic | **Hardware / residual** | Documented; not inventable |

---

## Code changes (evidence)

| Change | Path |
| --- | --- |
| Partial file cleanup on cancel/error | `src/services/DownloadManager.ts` |
| Free-space pre-check on enqueue | `src/services/DownloadManager.ts` |
| Installed file existence check | `src/services/AIService.ts` |
| Limited Vision honesty notice + prompts | `src/ai/vision/VisionService.ts` |
| Catalog vision description / inputTypes | `src/data/catalog.ts` |
| Home task / Playground labels | `src/discover/tasks.ts`, `PlaygroundScreen.tsx` |
| Play listing honesty | `store/play/LISTING.md` |

---

## Remaining work (not repository)

1. Deploy static `store/legal/*.html` to configured URLs (must show policy body, not SPA).  
2. Create signing credentials; produce signed AAB.  
3. Device QA + screenshots.  
4. Play Console forms and track upload.  
5. Optionally confirm publisher SHA256 for exact catalog URLs and fill `sha256` fields.

---

## Certification pointer

See [`FINAL_RELEASE_HANDOFF.md`](FINAL_RELEASE_HANDOFF.md).
