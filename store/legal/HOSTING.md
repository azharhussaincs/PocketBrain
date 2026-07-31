# Hosting PocketBrain legal pages

**Status:** Repository HTML + `store/legal/site/` deploy pack are production-ready. **Live hosting is an external action** — do not claim URLs are compliant until verified.

Publish from: [`store/legal/site/README.md`](site/README.md).


Configured app URLs (`app.json` → `extra`):

| Page | Expected public URL | Source file |
| --- | --- | --- |
| Privacy Policy | `https://pocketbrain.app/privacy` | `store/legal/privacy.html` |
| Terms of Service | `https://pocketbrain.app/terms` | `store/legal/terms.html` |
| Contact / Support | `https://pocketbrain.app/contact` or `/support` | `store/legal/contact.html` |
| AI Disclaimer | `https://pocketbrain.app/ai-disclaimer` | `store/legal/ai-disclaimer.html` |
| Licenses | `https://pocketbrain.app/licenses` | `store/legal/licenses.html` |
| FAQ | `https://pocketbrain.app/faq` | `store/legal/faq.html` |

---

## Requirements for Google Play

1. Privacy Policy URL must return **HTTP 200** (or HTTPS redirect to a page that still shows the **full policy text**).  
2. Content must be readable **without** requiring a JavaScript SPA shell.  
3. Do **not** host the Privacy Policy behind a marketing SPA that loads third-party analytics.  
4. Page title and body must clearly identify **PocketBrain Privacy Policy** (or Terms).  
5. After deploy, verify:

```bash
curl -sL https://pocketbrain.app/privacy | head -n 40
# Must show policy headings such as "Privacy Policy", "Data processed", etc.
```

---

## Recommended hosting options

| Option | How |
| --- | --- |
| **Static host (preferred)** | Upload `store/legal/*.html` to Vercel / Netlify / Cloudflare Pages / S3+CloudFront with clean routes |
| **GitHub Pages** | Publish `store/legal` as a static site; map custom domain `pocketbrain.app` |
| **Same domain, path rewrite** | Serve `/privacy` → `privacy.html` (pretty URLs) |

### Example: Vercel static routes

Place files so that:

- `/privacy` → `privacy.html`  
- `/terms` → `terms.html`  
- `/contact` → `contact.html`  
- `/ai-disclaimer` → `ai-disclaimer.html`  
- `/licenses` → `licenses.html`  
- `/faq` → `faq.html`  

Use `vercel.json` rewrites if needed:

```json
{
  "rewrites": [
    { "source": "/privacy", "destination": "/privacy.html" },
    { "source": "/terms", "destination": "/terms.html" },
    { "source": "/contact", "destination": "/contact.html" },
    { "source": "/support", "destination": "/contact.html" },
    { "source": "/ai-disclaimer", "destination": "/ai-disclaimer.html" },
    { "source": "/licenses", "destination": "/licenses.html" },
    { "source": "/faq", "destination": "/faq.html" }
  ]
}
```

---

## Deployment steps (operator checklist)

1. [ ] Choose a static host under your control for `pocketbrain.app`.  
2. [ ] Remove or bypass any redirect from `pocketbrain.app/privacy` to an unrelated SPA.  
3. [ ] Deploy the HTML files from `store/legal/`.  
4. [ ] Confirm HTTPS certificate is valid.  
5. [ ] `curl -sL` each URL and confirm policy/terms text is present.  
6. [ ] Confirm no unrelated analytics scripts on legal pages.  
7. [ ] Update Play Console Privacy Policy URL to match `app.json`.  
8. [ ] Record verification date in `release/FINAL_BLOCKERS.md`.

**This repository does not claim these URLs are live or compliant until the steps above are completed and verified.**
