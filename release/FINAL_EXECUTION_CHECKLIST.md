# Final Execution Checklist — Phase 18

**App:** PocketBrain **1.9.3** / `versionCode` **16**  
**Use:** Single page for the release engineer. Check only after real-world completion.

---

## A. Repository baseline (already expected green)

- [ ] `npm run lint` PASS  
- [ ] `npm test` PASS  
- [ ] `npm run verify:all` PASS (WARN screenshots / SKIP creds acceptable pre-creds)  
- [ ] Read `FINAL_RELEASE_HANDOFF.md`  

**Repo coding:** complete under feature freeze. No Phase 19 coding required for release readiness.

---

## B. Legal hosting (do first)

- [ ] Deploy `store/legal/*.html` per `LEGAL_DEPLOYMENT_GUIDE.md`  
- [ ] Remove SPA redirects for `/privacy` and `/terms`  
- [ ] `curl -sL https://pocketbrain.app/privacy` shows policy body  
- [ ] `curl -sL https://pocketbrain.app/terms` shows terms body  
- [ ] Mobile browser check  

---

## C. Signing & binary

- [ ] EAS credentials **or** local keystore created (not in git)  
- [ ] Signed AAB produced (`SIGNING_EXECUTION_GUIDE.md`)  
- [ ] Not debug-signed  
- [ ] Backups stored offline  

---

## D. Device validation

- [ ] P0 tests PASS (`DEVICE_EXECUTION_GUIDE.md`)  
- [ ] Vision shows Limited labeling  
- [ ] No fake image generation  

---

## E. Screenshots

- [ ] ≥2 real phone PNGs captured (`SCREENSHOT_PRODUCTION_GUIDE.md`)  
- [ ] Named and stored for Console upload  

---

## F. Play Console

- [ ] App created `com.pocketbrain.app`  
- [ ] Play App Signing enrolled  
- [ ] Listing pasted from `LISTING.md`  
- [ ] Privacy URL set and verified  
- [ ] Data Safety / Content Rating / Ads / Audience complete  
- [ ] AI disclosure honest (Limited Vision)  

---

## G. Internal Testing

- [ ] AAB uploaded to Internal  
- [ ] Release notes pasted  
- [ ] Testers invited and installed  
- [ ] Crashes/ANRs monitored (`INTERNAL_TESTING_PLAN.md`)  

---

## H. Later stages (not Internal-blocking)

- [ ] Closed testing  
- [ ] Optional Open testing  
- [ ] Production 5% → 20% → 50% → 100% (`PRODUCTION_ROLLOUT_PLAN.md`)  

---

## Stop condition

> **Repository development is complete. Further progress now depends entirely on external execution, including hosting, signing, hardware validation, screenshot capture, and Google Play Console operations.**

Do not invent Phase 19 repository feature work for release.

---

## Final questions (answered)

1. **Meaningful repository work left?** No Critical/High repo blockers remain for release engineering. Optional later: confirmed SHA256 when digests verified; streaming digest for huge files — not required to start External Validation.  
2. **Would further coding materially improve release readiness?** **No** — readiness is gated on hosting, signing, devices, Console.  
3. **External vs repository remaining work?** Roughly **~95%+ external / hardware**, **&lt;5%** optional repo polish.  
4. **Fastest path to Internal Testing?** E1 legal static HTML → E2/E3 signed AAB → E4 Play setup → E5 P0 smoke → E11 Internal upload.  
5. **Fastest path to Production?** Complete Internal exit criteria → screenshots + declarations → Closed confidence → staged Production rollout.  
6. **Highest-risk external task?** **Legal URL content** (wrong SPA fails policy) and **upload key custody** (lost key blocks updates).  
7. **Complete first?** **E1 — deploy correct static legal HTML** (unblocks Console trust + Data Safety URL).  
8. **Repo change before Production after externals done?** Only for **defect fixes**, versionCode bumps for new binaries, or confirmed integrity hashes — **not** new features.
