# Legal Website Deployment Guide — Phase 18

**Status:** Instructions only. **Deployment is not claimed.**  
**Source files:** `store/legal/*.html` (+ this repo’s `HOSTING.md`)  
**Configured URLs** (`app.json` → `extra`):

| Path | File |
| --- | --- |
| `https://pocketbrain.app/privacy` | `privacy.html` |
| `https://pocketbrain.app/terms` | `terms.html` |
| `https://pocketbrain.app/contact` (and `/support`) | `contact.html` |
| `https://pocketbrain.app/ai-disclaimer` | `ai-disclaimer.html` |
| `https://pocketbrain.app/licenses` | `licenses.html` |
| `https://pocketbrain.app/faq` | `faq.html` |

---

## Recommendation

**Prefer a dedicated static site** for legal pages (Cloudflare Pages, Netlify, or a **separate** Vercel project that only serves these HTML files).

**Do not** attach legal routes to a marketing SPA that:

- Requires JavaScript to render policy text  
- Injects third-party analytics  
- Redirects `pocketbrain.app/privacy` to an unrelated product shell  

Phase 16 live probe observed that pattern — it **fails** Play policy expectations even with HTTP 200.

**GitHub Pages** is suitable if you map the custom domain and publish only static HTML.  
**Nginx** is suitable for self-hosting with TLS (Let’s Encrypt).

**Ranked recommendation:** 1) Cloudflare Pages  2) Netlify  3) Vercel static-only project  4) Nginx  5) GitHub Pages.

---

## What to upload

Upload **only** the HTML files from:

```text
store/legal/privacy.html
store/legal/terms.html
store/legal/contact.html
store/legal/ai-disclaimer.html
store/legal/licenses.html
store/legal/faq.html
```

Do **not** upload `HOSTING.md` as a public page (optional).

### Expected URL structure

Pretty paths without `.html` (recommended):

```text
/privacy → privacy.html
/terms → terms.html
/contact → contact.html
/support → contact.html
/ai-disclaimer → ai-disclaimer.html
/licenses → licenses.html
/faq → faq.html
```

---

## Cloudflare Pages

1. Create a project from a folder that contains the six HTML files at the site root (or use a deploy directory copy).  
2. Build command: none (static).  
3. Add `_redirects` or Pages Functions / bulk redirects if needed, or rename/copy:

```text
/privacy  /privacy.html  200
/terms  /terms.html  200
...
```

4. Attach custom domain `pocketbrain.app`.  
5. Confirm SSL Full (strict).  
6. **Remove** any prior redirect to `pocketbrain.chat` SPA for `/privacy` and `/terms`.

---

## Netlify

1. Deploy folder containing the HTML files.  
2. Add `netlify.toml` or `_redirects`:

```text
/privacy  /privacy.html  200
/terms    /terms.html    200
/contact  /contact.html  200
/support  /contact.html  200
/ai-disclaimer /ai-disclaimer.html 200
/licenses /licenses.html 200
/faq      /faq.html      200
```

3. Custom domain + HTTPS.  
4. Disable SPA fallback (`/* /index.html 200`) for this site.

---

## Vercel (static-only project)

Use a **new** project whose root is only legal HTML — not the existing SPA.

`vercel.json`:

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

Point `pocketbrain.app` DNS to this project only for legal paths, or host the whole apex on this static site.

---

## GitHub Pages

1. Repo or `/docs` / `gh-pages` branch with HTML at root.  
2. Settings → Pages → custom domain `pocketbrain.app`.  
3. Enforce HTTPS.  
4. Add same path mapping via extensionless files or Jekyll-free static layout.

---

## Static Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name pocketbrain.app;
  root /var/www/pocketbrain-legal;
  # ssl_certificate …;

  location = /privacy { try_files /privacy.html =404; }
  location = /terms { try_files /terms.html =404; }
  location = /contact { try_files /contact.html =404; }
  location = /support { try_files /contact.html =404; }
  location = /ai-disclaimer { try_files /ai-disclaimer.html =404; }
  location = /licenses { try_files /licenses.html =404; }
  location = /faq { try_files /faq.html =404; }
}
```

---

## Verification (mandatory)

### HTTPS / curl

```bash
curl -sI https://pocketbrain.app/privacy
curl -sL https://pocketbrain.app/privacy | head -n 50
curl -sL https://pocketbrain.app/terms | head -n 50
```

**Pass:** TLS valid; body contains “Privacy Policy” / “Terms” and PocketBrain data-processing language from the HTML sources.  
**Fail:** SPA shell, empty `#root`, unrelated product title, analytics-only page, 404.

### Browser

Open each URL in a clean profile with JS disabled (or View Source). Policy text must still be readable.

### Mobile

Open Privacy URL on a phone browser; confirm readable without app install.

### Play Console

Paste the same URLs into the Privacy Policy field. Re-check after any DNS change.

---

## Operator checklist

- [ ] Static host chosen (not marketing SPA)  
- [ ] Six HTML files deployed  
- [ ] Pretty routes work  
- [ ] Old SPA redirects removed  
- [ ] `curl -sL` Privacy/Terms PASS  
- [ ] No third-party analytics on legal pages  
- [ ] Verification date recorded by the operator (not in this guide as completed)
