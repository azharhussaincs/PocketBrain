# Deploy legal pages (static)

This folder is a **ready-to-publish** static site copied from `store/legal/*.html`.

## Why this matters

Google Play requires a Privacy Policy URL that returns real policy HTML (not a marketing SPA).  
Configured production URLs: `https://pocketbrain.app/privacy` and `https://pocketbrain.app/terms`.

## Deploy (pick one)

### Vercel
```bash
cd store/legal/site
npx vercel --prod
# Then attach custom domain pocketbrain.app and map /privacy → privacy.html
```

### Netlify
```bash
cd store/legal/site
npx netlify deploy --prod --dir .
```

### GitHub Pages
Publish this `site/` folder (or `store/legal/*.html`) as Pages. Point `pocketbrain.app` DNS to Pages, or temporarily use:
`https://<user>.github.io/<repo>/privacy.html`

## Verify after deploy
```bash
curl -sL https://pocketbrain.app/privacy | head -n 40
curl -sL https://pocketbrain.app/terms | head -n 40
```
You must see PocketBrain policy/terms headings in the HTML body without relying on JavaScript.
