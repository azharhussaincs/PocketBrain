# Known limitations — PocketBrain 1.9.3

1. Live Privacy/Terms URLs must serve `store/legal/*.html` bodies (Phase 16 probe found SPA shell — **external hosting**).
2. No physical-device RC matrix completed in this environment (**hardware**).
3. Signed production AAB requires upload credentials (**external**). Fail-closed release signing is configured in-repo.
4. Play screenshots are not captured (templates only — no fabricated images).
5. Real GGUF inference requires native `llama.rn` build (Expo Go = labeled mock).
6. **Vision is limited:** this build does not load image pixels into GGUF; results are labeled `[Limited Vision]`. Prefer OCR for reading text in photos.
7. Image generation is capability-gated; no fake pixels.
8. Catalog `sha256` fields are blank until digests are confirmed for the exact `downloadUrl` (never invent hashes). Verify path runs when hashes are present.
9. Video generation, RAG, plugins, cloud sync, ads, subscriptions are deferred.
10. Support email deliverability not verified.
11. TalkBack / performance profiling not device-verified.
12. English UI only (i18n scaffolding exists).
