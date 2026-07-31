# Internal Testing Plan — Phase 18

**Goal:** First real Google Play track with limited testers.  
**Binary:** Signed AAB **1.9.3** / `versionCode` **16** (or newer intentional bump).  
**Prerequisites:** E1 legal HTML live, E2–E4 signing, E5 P0 smoke PASS.

---

## 1. Upload

1. Play Console → Testing → Internal testing → Create release.  
2. Upload AAB.  
3. Confirm versionName / versionCode.  
4. Paste release notes from `store/play/RELEASE_NOTES.md`.  
5. Save → Review → Start rollout to Internal.

**Success:** Release status Active/Available to testers.  
**Fail:** Signing mismatch, versionCode reuse, missing declarations.

---

## 2. Tester invitation

| Method | Use |
| --- | --- |
| Email list | Small trusted group (5–20) |
| Google Group | Team alias |

Testers must:

1. Accept invite link  
2. Opt into Internal testing program  
3. Install from Play Store (not random APK sideload if validating Play path)

**Success:** ≥3 installs from distinct devices preferred.

---

## 3. Feedback collection

Ask testers to report:

- Crash / ANR (with Android version + steps)  
- Download failures  
- Inference quality / hang  
- Permission UX  
- Export/share issues  
- Honesty issues (Vision labeling)

Channel: email `support@pocketbrain.app` or private tracker (external).

---

## 4. Monitoring (Play Console)

| Signal | Cadence | Action |
| --- | --- | --- |
| Crashes | Daily first week | Triage; hotfix only if Critical repo defect |
| ANRs | Daily | Reproduce on device |
| Install base | Daily | Confirm testers joined |
| User feedback | Continuous | Log severity |

No in-app crash SDK by design — rely on Play Vitals + tester reports.

---

## 5. Bug triage

| Severity | Definition | Response |
| --- | --- | --- |
| S0 | Crash on launch / data loss | Halt tester expansion; fix or rollback |
| S1 | Core chat/download broken | Fix before Closed |
| S2 | Secondary feature (OCR/Vision limited) | Document; schedule if freeze allows defect fix |
| S3 | Cosmetic | Backlog |

Feature freeze: **defect fixes only**, no new features.

---

## 6. Rollback

Internal track:

1. Stop rollout / create new release with previous AAB if needed.  
2. Communicate to testers.  
3. Do not delete upload keys.

---

## 7. Exit criteria → Closed Testing

- [ ] ≥3–5 days Internal without S0  
- [ ] P0 matrix still green on latest AAB  
- [ ] Legal URLs still valid  
- [ ] Screenshots captured or scheduled before Production  
- [ ] Known Limited Vision behavior accepted by stakeholders  

Then follow `PRODUCTION_ROLLOUT_PLAN.md` Closed stage.
