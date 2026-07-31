# External Validation Master Plan — Phase 18

**App:** PocketBrain · `com.pocketbrain.app` · **1.9.3** / `versionCode` **16**  
**Starting certification:** 🟡 Repository Ready for External Validation  
**Target for this plan:** Google Play **Internal Testing**  
**Rule:** Checkboxes are for **operators**. Do not mark done unless the action was performed in the real world.

---

## Critical path (do in this order)

```text
E1 Legal static hosting  →  E1b HTTPS/DNS
        ↓
E2 Signing credentials  →  E3 Signed AAB
        ↓
E4 Play App Signing + Developer account
        ↓
E5 Device P0 smoke QA
        ↓
E11 Console listing fields + Internal track upload + testers
```

Screenshots (E6) and full Console declarations (E8–E10) can trail Internal if policy allows incomplete store listing visuals on Internal — **Production listing still needs E6+**. Prefer capturing screenshots during E5.

---

## Master checklist

| ID | Task | Objective | Prerequisites | Est. | Tools | Success criteria |
| --- | --- | --- | --- | --- | --- | --- |
| E0 | Confirm repo green | Baseline before ops | Clone of 1.9.3 | 15m | Node 20+, npm | `npm run lint && npm test && npm run verify:all` PASS (WARN screenshots / SKIP creds OK) |
| E1 | Host legal HTML | Serve real policy bodies | Domain access | 1–4h | Static host (see LEGAL_DEPLOYMENT_GUIDE) | `curl -sL` Privacy/Terms show PocketBrain policy headings, **not** SPA shell |
| E1b | DNS + HTTPS | Trustworthy URLs | E1 | 0.5–2h | DNS, cert | Valid TLS; URLs match `app.json` `extra.privacyPolicyUrl` / terms |
| E12 | Support mailbox | Receive Play support mail | MX for support@ | 15–60m | Email provider | Test message received |
| E2 | Upload keystore or EAS creds | Sign releases | Expo acct or `keytool` | 0.5–2h | eas-cli / keytool | Credentials stored **outside git**; never commit |
| E3 | Signed production AAB | Binary for Play + device | E0, E2 | 0.5–2h | EAS or Gradle | AAB built; **not** debug-signed; versionName 1.9.3 / versionCode 16 |
| E4 | Play Developer + App Signing | Console ready | Google Play $ fee paid | 0.5–2h | Play Console | App created; Play App Signing enrolled |
| E5 | Physical device P0 QA | Prove install + core paths | E3 binary | 4–8h | Android API 26+ phone | DEVICE_EXECUTION_GUIDE P0 all PASS |
| E6 | Screenshots ≥2 phone | Listing assets | E5 smoke | 1–3h | Device capture | Real PNGs per SCREENSHOT_PRODUCTION_GUIDE (no fakes) |
| E7 | Expanded hardware matrix | GGUF/OCR/STT/export depth | E5 | 4–8h | Same devices | High-priority rows PASS |
| E8 | Data Safety form | Console compliance | E1 live policy | 1–2h | Play Console | Matches `release/DATA_SAFETY.md` |
| E9 | Content Rating | IARC | Play account | 0.5–1h | Play Console | Questionnaire complete |
| E10 | Ads / audience / app content | Declarations | — | 0.5–1h | Play Console | No ads; age/audience truthful |
| E11 | Internal Testing upload | First Play track | E1–E5, E4, AAB | 1–3h | Play Console | Testers can install; release notes from `store/play/RELEASE_NOTES.md` |

---

## Parallelism

| Can run in parallel | Blocked until |
| --- | --- |
| E1 hosting + E2 credentials | — |
| E12 mailbox | Domain/MX |
| E4 Play account setup | Payment / identity verification |
| E8–E10 drafting from docs | Must not submit until E1 live |
| E5–E6 | Need E3 AAB (or sideload APK from preview profile for early QA — Production track still needs AAB) |

---

## Explicit non-claims

This plan does **not** assert that any E-item is complete. Phase 16 probe found Privacy/Terms serving an unrelated SPA — treat E1 as **required rework**, not optional polish.

---

## Related guides

| Guide | Path |
| --- | --- |
| Legal deploy | `LEGAL_DEPLOYMENT_GUIDE.md` |
| Signing | `SIGNING_EXECUTION_GUIDE.md` |
| Device QA | `DEVICE_EXECUTION_GUIDE.md` |
| Screenshots | `SCREENSHOT_PRODUCTION_GUIDE.md` |
| Play Console | `PLAY_CONSOLE_EXECUTION_GUIDE.md` |
| Internal track | `INTERNAL_TESTING_PLAN.md` |
| Production stages | `PRODUCTION_ROLLOUT_PLAN.md` |
| One-page checklist | `FINAL_EXECUTION_CHECKLIST.md` |
| Dependency table | `EXTERNAL_DEPENDENCIES.md` |
