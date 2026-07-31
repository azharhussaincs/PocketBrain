# PRODUCTION_HANDOFF.md

**To:** Release engineer / QA lead  
**From:** PocketBrain Deployment RC (Phase 14)  
**App:** `com.pocketbrain.app` · **1.9.3** / `versionCode` **16**  

This handoff assumes **no prior knowledge** of the project. Follow documents in order.

---

## 1. Repository status

| Item | Status |
| --- | --- |
| Feature scope (offline-first AI OS) | Complete for launched scope |
| Honesty gates (no fake AI/OCR/images) | Present |
| Release freeze | Active — see `REPOSITORY_FREEZE.md` |
| Automation | `npm run verify:all` |
| Signed AAB in this environment | **Not produced** (credentials external) |
| Device QA | **Not executed** |
| Live legal URLs | **Must be hosted** from `store/legal/` |

---

## 2. Build instructions

```bash
git clone <REPO> PocketBrain && cd PocketBrain
npm install
npm run lint && npm test && npm run verify:all
```

Prefer EAS:

```bash
npm install -g eas-cli && eas login
eas build -p android --profile production
```

Local alternative: `DEPLOYMENT_RUNBOOK.md` + `APP_SIGNING.md` (`PB_UPLOAD_*`).

`eas.json` production profile builds **app-bundle**.

---

## 3. Signing instructions

1. Never commit keystores or passwords.  
2. Use EAS credentials **or** `PB_UPLOAD_STORE_FILE` + password/alias env vars.  
3. Plugin fails closed without credentials (no silent debug release).  
4. Enroll **Play App Signing** in Console.  

Details: `APP_SIGNING.md`.

---

## 4. Device QA

1. Install native RC binary (not Expo Go for GGUF).  
2. Execute **P0** rows in `DEVICE_QA_CHECKLIST.md` (leave blanks until tested).  
3. Use `HARDWARE_VERIFICATION_PLAN.md` for GGUF/OCR/STT/export log expectations.  
4. Capture logcat for failures.  

**Do not invent PASS.**

---

## 5. Play submission

1. Host `store/legal/*.html` (`HOSTING.md`) — curl must show policy body.  
2. Rehearse Console with `PLAYSTORE_REHEARSAL.md` / `PLAYSTORE_SUBMISSION_GUIDE.md`.  
3. Paste listing from `store/play/LISTING.md`.  
4. Upload graphics from `assets/play/`.  
5. Screenshots only after real capture (`SCREENSHOT_CAPTURE_GUIDE.md`).  
6. Data Safety ← `DATA_SAFETY.md`; Rating ← `CONTENT_RATING.md`; Notes ← `REVIEW_NOTES.md`.  
7. Upload AAB to **Internal testing** first.  

---

## 6. Rollback plan

| Scenario | Action |
| --- | --- |
| Bad Internal build | Halt rollout; fix; bump `versionCode`; new AAB |
| Policy rejection | Fix listing/legal/Data Safety; resubmit with evidence |
| Critical production crash | Halt staged rollout %; publish hotfix AAB; use Play halt if needed |
| Lost upload key | Rely on Play App Signing recovery; if not enrolled, escalate immediately |

Keep previous AAB artifacts and release notes for each `versionCode`.

---

## 7. Post-release monitoring

- Play Console → Android Vitals (crash-free, ANR)  
- User reviews / support@ inbox  
- Re-run `verify:all` on every release branch  
- Do **not** add analytics SDKs without Data Safety update + freeze exception  

---

## 8. Known limitations

See `KNOWN_LIMITATIONS.md`. Highlights:

- Real GGUF needs native `llama.rn` build  
- Vision/image generation gated / not production multimodal  
- Live legal hosting and device QA are external  
- Dense 8-tab UX risk on small phones (frozen; next version)  

---

## 9. Recommended track order

1. External: hosting + credentials + AAB + P0 QA  
2. **Internal Testing**  
3. Closed Testing (after Internal PASS + screenshots)  
4. Staged **Production** (not immediate 100%)  

**Google approval is never guaranteed.**
