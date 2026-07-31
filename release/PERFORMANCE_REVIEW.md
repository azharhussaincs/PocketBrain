# Performance review — Phase 15

**Date:** 2026-07-30  
**Prior note:** Phase 10 review recorded mitigations without device profiling. That limitation remains: **no physical-device FPS/RSS numbers** were collected in this environment.

## Measurable code optimizations (this phase)

| Optimization | Reason | Where |
| --- | --- | --- |
| Shared `LIST_PERF` FlatList props | Reduce over-render / offscreen work on long lists | Downloads, Models, Home, Files, Global Search, Marketplace (main list), Workspace dashboard, Templates |
| Marketplace `initialNumToRender={6}` retained | Model cards are heavier than text rows | `MarketplaceScreen` |
| Chat list tuning left as-is | Already stronger window/batch settings for streaming transcripts | `ChatScreen` |
| Download filename sanitize | Avoid pathological path segments that can fail FS ops | `DownloadManager.getModelFile` |

## Areas reviewed (no change needed)

| Area | Status |
| --- | --- |
| Model load / unload | Existing runtime diagnostics + largeHeap; no safe change without device data |
| Download concurrency | Cap `MAX_CONCURRENT = 2` appropriate |
| Search | In-memory / local file — fine for expected library sizes |
| Image / OCR | On-demand pickers; no eager decode caches found |
| Memoization | Avoided blanket `useMemo`/`useCallback` without measured need |

## Memory / resource notes

| Concern | Finding |
| --- | --- |
| DownloadTask release | `task.release()` in `finally` on finish/resume paths |
| SHA verify | Loads file bytes once for digest; deletes file on mismatch |
| Corrupt queue | Cleared from memory + AsyncStorage to avoid growing bad state |
| Image handling | Picker URIs; no unbounded in-memory image cache identified |

## Device profiling still required (external)

Record on mid-range Android 12–14 release builds:

1. Cold / warm start to interactive Home  
2. Peak RSS during starter GGUF load  
3. Tokens/s for starter model  
4. Scroll FPS — Marketplace + long Chat  
5. Search latency with 100+ docs  
6. Battery drop over 10-minute generation  

## Known residual risks

- Large GGUF on &lt;4 GB RAM devices  
- SHA-256 of multi-GB files is memory-heavy (full `file.bytes()`); acceptable for current catalog sizes, revisit if multi-GB weights ship  
- `removeClippedSubviews` can glitch on unusual nested scrollers — applied only to primary vertical lists
