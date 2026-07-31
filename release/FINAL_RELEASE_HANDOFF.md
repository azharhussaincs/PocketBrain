# Final Release Handoff — Phase 17

**Date:** 2026-07-31  
**App:** PocketBrain · `com.pocketbrain.app` · **1.9.3** / `versionCode` **16**  
**Audience:** Release engineer / Play Console operator

---

## Final certification (exactly one)

# 🟡 Repository Ready for External Validation

| Option | Selected? |
| --- | --- |
| ❌ Repository Not Ready | No |
| 🟡 Repository Ready for Release Engineering | Superseded by this tighter certification |
| 🟡 Repository Ready for External Validation | **Yes** |
| 🟢 Repository Ready for Internal Testing (after external prerequisites) | **Conditional** — yes **after** E1–E5 + E11 below |
| 🟢 Repository Ready for Production | **No** |

### Evidence

- Repository-controlled Phase 16 High/Medium items addressed or justified (Vision honesty, download cleanup, file exists check, doc sync, SHA policy).  
- `lint` / `test` / `verify:all` must be green at handoff.  
- No Critical **repository** blockers remain that prevent building after credentials.  
- Critical **external** blockers remain (legal hosting content, credentials, AAB, device QA, screenshots).

---

## Certification Q&A

1. **Remaining repository-controlled Critical issues?** **No.**  
2. **Remaining repository-controlled High issues?** **No open Highs** that are still unfixed without justification. Vision honesty and missing-file load fixed; SHA blank by policy (documented); full-file digest RAM residual documented.  
3. **Can another engineer build after providing signing credentials?** **Yes** — fail-closed signing plugin + `APP_SIGNING.md` + EAS profile.  
4. **Documentation internally consistent?** **Yes for canonical packaging surfaces**; historical FINAL_* archives superseded where they conflict.  
5. **Model catalog integrity mechanism ready for production?** **Mechanism yes; enforcement pending confirmed hashes** (none invented).  
6. **All remaining blockers external?** **External or hardware-dependent** — yes for Play track entry.  
7. **Suitable for long-term maintenance?** **Yes** under feature freeze.  
8. **Freeze and stop feature development?** **Yes** — continue freeze; only defect/external ops work.

---

## External prerequisites (do these next)

| # | Task | Owner |
| --- | --- | --- |
| E1 | Deploy `store/legal/*.html` so Privacy/Terms URLs show **policy body** (not SPA) | Web |
| E2 | Create upload keystore or EAS Android credentials | Release eng |
| E3 | Produce signed production AAB | Release eng |
| E4 | Play App Signing enrollment | Play admin |
| E5 | Physical Android P0 smoke QA | QA |
| E6 | ≥2 real phone screenshots | QA |
| E8–E10 | Data Safety / Content Rating / declarations | Compliance |
| E11 | Console listing + Internal track upload | Release manager |

Full table: [`EXTERNAL_DEPENDENCIES.md`](EXTERNAL_DEPENDENCIES.md).

---

## Build commands (engineer)

```bash
npm ci
npm run lint && npm test && npm run verify:all
# With credentials configured per APP_SIGNING.md:
# eas build -p android --profile production
# or local release assemble after keystore.properties / PB_UPLOAD_*
```

---

## Do not

- Fabricate screenshots, device results, hosted legal content, or Play approval.  
- Invent SHA256 values.  
- Ship Vision as full multimodal image understanding.  
- Mark Production ready until Critical externals clear.

---

## Pack index

| Report | Path |
| --- | --- |
| Release engineer | `RELEASE_ENGINEER_REPORT.md` |
| Health | `REPOSITORY_HEALTH_REPORT.md` |
| Model integrity | `MODEL_INTEGRITY_REPORT.md` |
| Doc consistency | `DOCUMENTATION_CONSISTENCY_REPORT.md` |
| This handoff | `FINAL_RELEASE_HANDOFF.md` |
