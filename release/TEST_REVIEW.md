# Test review — Phase 15

**Date:** 2026-07-30  
**Runner:** `npm test` → `node --test tests/*.test.mjs`

## Suite shape

Existing tests are **honest, filesystem/policy-oriented** Node tests (release gates, discovery helpers, branding/docs presence) — not simulated device E2E. That matches PocketBrain’s “never fabricate QA” rule.

## Improvements this phase

| Change | Why |
| --- | --- |
| `tests/phase15-engineering.test.mjs` | Covers sanitize/error formatters, shared model-id helper usage, dead `ModelCard` removal, Phase 15 report presence |
| No artificial coverage padding | Avoids empty “assert true” tests |

## Coverage assessment

| Layer | Coverage | Gap |
| --- | --- | --- |
| Release / verify scripts | Strong via verify + phase tests | — |
| Discover helpers | Partial (mirrored logic in discovery.test) | Prefer importing modules if Node-safe |
| DownloadManager / ModelManager | Indirect via code review | Needs device/integration for real downloads |
| UI components | Manual / checklist | Detox/Maestro still external |
| Inference (llama.rn) | Not unit-tested here | Device-only |

## Reliability / isolation

- Tests use `node:test` + `node:assert` with no shared mutable global app state.  
- Phase 15 mirrors pure helpers in the test file (same pattern as discovery tests) to avoid Metro/TS import friction in Node.

## Recommendations (meaningful only)

1. When catalog gains `sha256` fields, add a pure hex-normalize compare unit test.  
2. Add a thin Node-safe export of `sanitizeFileName` / error formatters if duplication with the mirrored test becomes painful.  
3. Device QA checklist remains the authority for runtime/UI regression — do not pretend Node tests replace it.

## Conclusion

Test suite quality improved for engineering helpers and structure. End-to-end production confidence still requires **external device QA**, not more synthetic unit tests.
