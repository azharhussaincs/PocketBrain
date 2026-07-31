# Why Play is not 100% yet (and what is)

**Product version:** 1.0.0 / `versionCode` 17  
**Date:** 2026-07-31

| Track | Completion | Who finishes it |
| --- | ---: | --- |
| Repository / app code (agreed scope) | **100%** | Done in git |
| Legal HTML **sources** + deploy pack | **100%** | Done in `store/legal/site/` |
| Live Privacy/Terms on `pocketbrain.app` | **0%** until deploy | **You** (Vercel/Netlify/Pages) |
| Play listing drafts + screenshots | **~90%** | Drafts ready; Console upload is you |
| Upload signing + AAB for Play | **0%** | **You** (EAS or upload keystore) |
| Google Play Internal / Production | **NOT READY** | **You** in Play Console |

## Exact remaining steps

See [`FINAL_EXTERNAL_ACTIONS.md`](FINAL_EXTERNAL_ACTIONS.md).

1. Deploy `store/legal/site/` to `pocketbrain.app`  
2. Create/backup Play upload credentials  
3. Build signed AAB  
4. Run device P0 checklist  
5. Fill Play Console + Internal testing  

Until step 1–5 pass, **do not** change README Play badge to READY or claim overall product 100%.
