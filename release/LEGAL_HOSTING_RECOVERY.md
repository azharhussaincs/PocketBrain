# Legal Hosting Recovery — PocketBrain (Step 1)

**Status:** Live verification **FAILING** as of last probe (do not mark complete until curls pass).  
**Repo HTML:** `store/legal/*.html` (correct static content).  
**Configured URLs:** `https://pocketbrain.app/privacy` and `/terms` (see `app.json` `extra`).

---

## Root cause (verified)

| Finding | Evidence |
| --- | --- |
| `pocketbrain.app` is on **Vercel** | Response header `server: Vercel` |
| Apex **redirects all traffic** to `pocketbrain.chat` | `curl -sI https://pocketbrain.app/privacy` → **307** `Location: https://pocketbrain.chat/privacy` (same for `/`, `/terms`, `/contact`, …) |
| Destination is a **React SPA**, not legal HTML | Body: empty `<div id="root"></div>`, title “powered by runinbrowser-ai”, Umami + `/assets/index-*.js` |
| SPA catch-all | Even `https://pocketbrain.chat/privacy.html` returns the **same** `index.html` (etag/size match) |
| DNS is **not** “broken” | `pocketbrain.app` resolves (A `216.198.79.1`); NS at Spaceship (`launch*.spaceship.net`) |
| Repo file is correct | Local `store/legal/privacy.html` title “PocketBrain Privacy Policy” — **never served** live |

**Exact failure:** Wrong Vercel project + domain redirect `.app` → `.chat` + SPA fallback. Not a missing DNS A record. Not Cloudflare in the path (Vercel terminates TLS).

---

## Required end state

```text
https://pocketbrain.app/privacy  → 200 + body of store/legal/privacy.html (no JS required)
https://pocketbrain.app/terms    → 200 + body of store/legal/terms.html
… same for /contact /support /faq /licenses /ai-disclaimer
```

No 307 to `pocketbrain.chat` for these paths. No empty `#root`. No Umami on legal pages.

---

## Recommended fix (Vercel — matches current stack)

### Option A — Separate static project (recommended)

1. Create a **new** Vercel project (e.g. `pocketbrain-legal`).  
2. Upload only these files at project root (from this repo):

```text
privacy.html
terms.html
contact.html
ai-disclaimer.html
licenses.html
faq.html
vercel.json
```

3. `vercel.json`:

```json
{
  "cleanUrls": false,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/privacy", "destination": "/privacy.html" },
    { "source": "/terms", "destination": "/terms.html" },
    { "source": "/contact", "destination": "/contact.html" },
    { "source": "/support", "destination": "/contact.html" },
    { "source": "/ai-disclaimer", "destination": "/ai-disclaimer.html" },
    { "source": "/licenses", "destination": "/licenses.html" },
    { "source": "/faq", "destination": "/faq.html" }
  ],
  "headers": [
    {
      "source": "/(.*)\\.html",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=300" }]
    }
  ]
}
```

**Do not** add a SPA rewrite like `{ "source": "/(.*)", "destination": "/index.html" }`.

4. In Vercel → Domains:  
   - **Remove** `pocketbrain.app` from the **SPA / runinbrowser** project (or remove the Redirect domain rule to `pocketbrain.chat`).  
   - **Add** `pocketbrain.app` to `pocketbrain-legal`.  
5. Keep marketing on `pocketbrain.chat` if desired — do **not** redirect legal paths from `.app` to `.chat`.

### Option B — Same account, path rules on SPA project (harder)

Only if you insist on one project:

1. Deploy the six HTML files into that project’s `public/` (or output dir).  
2. Add the rewrites above **before** any SPA catch-all.  
3. **Delete** Domain Redirect from `pocketbrain.app` → `pocketbrain.chat` (Vercel Domains → Redirect).  
4. Ensure catch-all SPA rewrite does **not** override `/privacy` etc. (Vercel matches more specific rewrites first — still verify with curl).

Option A is safer.

---

## Cloudflare Pages

If you move off Vercel for legal only:

`_redirects` (200 = rewrite, not browser redirect):

```text
/privacy  /privacy.html  200
/terms  /terms.html  200
/contact  /contact.html  200
/support  /contact.html  200
/ai-disclaimer  /ai-disclaimer.html  200
/licenses  /licenses.html  200
/faq  /faq.html  200
```

Point `pocketbrain.app` DNS to Cloudflare Pages; **remove** Vercel redirect to `.chat`.

---

## Netlify

`_redirects` (same as Cloudflare 200 rewrites) or `netlify.toml`:

```toml
[[redirects]]
  from = "/privacy"
  to = "/privacy.html"
  status = 200
# … repeat for terms, contact, support, ai-disclaimer, licenses, faq
```

Disable SPA `/* /index.html 200` on this site.

---

## Nginx

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

## Apache

```apache
RewriteEngine On
RewriteRule ^privacy/?$ privacy.html [L]
RewriteRule ^terms/?$ terms.html [L]
RewriteRule ^contact/?$ contact.html [L]
RewriteRule ^support/?$ contact.html [L]
RewriteRule ^ai-disclaimer/?$ ai-disclaimer.html [L]
RewriteRule ^licenses/?$ licenses.html [L]
RewriteRule ^faq/?$ faq.html [L]
```

---

## Validation (must all pass)

```bash
# Must NOT 307 to pocketbrain.chat
curl -sI https://pocketbrain.app/privacy | head -20

# Must show "PocketBrain Privacy Policy" in HTML
curl -sL https://pocketbrain.app/privacy | head -40

curl -sL https://pocketbrain.app/terms | head -40

# Optional: other paths
for p in contact support faq licenses ai-disclaimer; do
  echo "== $p"; curl -sI "https://pocketbrain.app/$p" | head -5
  curl -sL "https://pocketbrain.app/$p" | head -5
done

# Cache bust
curl -sL -H 'Cache-Control: no-cache' https://pocketbrain.app/privacy | head -20
```

Browser: View Source (not only rendered DOM). Incognito. Phone browser. Disable JS — policy text must remain visible.

**Pass:** HTTP 200 (or same-host HTTPS redirect only), `text/html`, title/body match repo legal HTML, no `#root`-only SPA, no Umami on legal pages.

---

## Common Play rejection reasons (legal URL)

- SPA / JS-only policy  
- Redirect to unrelated product  
- Login wall  
- 404 / empty page  
- Broken HTTPS  
- Wrong content-type  
- Analytics-only shell  
- Robots blocking (less common if HTML exists)  
- Policy for a different app name  

---

## After fix

Paste curl evidence to the Release Execution Assistant. Only then: **Step 2 — Verify live URLs** (formal pass) and continue the external path.
