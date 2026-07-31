# Privacy checklist

| Requirement | Status |
| --- | --- |
| No accounts required | Yes |
| No ads SDK | Yes |
| No analytics SDK | Yes |
| No crash SDK | Yes |
| In-app Privacy Policy | Yes |
| In-app Terms | Yes |
| In-app AI disclaimer | Yes |
| Mic/camera/photos only on feature use | Yes (runtime prompts) |
| Model download consent | Yes |
| Published HTTPS Privacy URL | **BLOCKER — wrong content** (HTTP 200 after redirect to `pocketbrain.chat/privacy`, but response is a SPA shell titled “Pocket Brain - powered by runinbrowser-ai”, **not** `store/legal/privacy.html`) |
| Published HTTPS Terms URL | **BLOCKER — wrong content** (same SPA shell pattern; not `store/legal/terms.html`) |
| Data Safety form matches reality | Draft in `DATA_SAFETY_CHECKLIST.md` |
| allowBackup disabled | Configured `android.allowBackup: false` in app.json (re-prebuild) |

## Hosting steps

1. Deploy `store/legal/privacy.html` → `https://pocketbrain.app/privacy`
2. Deploy `store/legal/terms.html` → `https://pocketbrain.app/terms`
3. Verify HTTP 200 and content matches in-app policy
4. Paste URLs into Play Console
