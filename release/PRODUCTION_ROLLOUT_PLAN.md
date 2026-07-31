# Production Rollout Plan — Phase 18

**Rule:** Do not skip straight to 100% Production without Internal/Closed signal.  
**Rule:** Google Play approval is never guaranteed.

---

## Stage map

| Stage | Audience | Goal | Monitor |
| --- | --- | --- | --- |
| **Internal** | Dev/QA emails | Prove Play install path | Crashes/ANRs, install success |
| **Closed** | Larger trusted cohort | Scale QA; listing polish | Crashes, feedback themes |
| **Open testing** (optional) | Public testers | Pre-prod confidence | Reviews, vitals |
| **Production 5%** | Staged rollout | Canary | Spike in crash rate → halt |
| **Production 20%** | Expand | Stability | Same |
| **Production 50%** | Expand | Stability | Same |
| **Production 100%** | All | Full release | Ongoing vitals |

---

## Gate into each stage

### Internal → Closed

- Internal exit criteria met (`INTERNAL_TESTING_PLAN.md`)  
- ≥2 real screenshots uploaded  
- Data Safety + Content Rating + ads/audience complete  
- Privacy/Terms still static HTML  

### Closed → Open (optional)

- No unresolved S0/S1  
- Stakeholder sign-off on Limited Vision messaging  

### Open/Closed → Production 5%

- Console “Production” release created from same or newer versionCode  
- Release notes accurate  
- Support mailbox monitored  

### 5% → 20% → 50% → 100%

Promote only if:

- Crash-free users rate stable vs baseline  
- No emergent policy takedown risk  
- No signing/update failures  

**Halt / rollback** if crash rate spikes, critical security issue, or policy violation (e.g. legal URL breaks).

---

## Monitoring expectations

| Metric | Watch |
| --- | --- |
| Crash rate | Play Vitals |
| ANR rate | Play Vitals |
| Bad reviews mentioning privacy/cloud | Respond; verify offline claims |
| Install failures | Device/API coverage |
| Support email volume | Capacity |

Cadence: **daily** during staged Production week 1; then weekly.

---

## VersionCode discipline

Every Play upload needs a **new** `versionCode`. Coordinate bumps in `app.json` / `package.json` / gradle together when producing a new binary. Do not invent repo changes solely to “look busy” between stages.

---

## Post-100%

- Keep legal pages online  
- Keep upload key backed up  
- Feature freeze until a planned milestone  
- Optional: add confirmed catalog SHA256 via careful ops (see `MODEL_INTEGRITY_REPORT.md`) — not required to stay at 100% if already live  

---

## Explicit non-goal

This document does **not** mark any stage complete.
