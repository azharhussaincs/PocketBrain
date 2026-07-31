# Security review — Phase 15

**Date:** 2026-07-30  
**Constraint:** Harden without changing intended product behavior; no new network backends.

## Actions taken

| Item | Action |
| --- | --- |
| Model file paths | `sanitizeFileName` on model id and file name before writing under Documents/models |
| Download retry paths | Uses sanitized model-id prefix when reconstructing filenames |
| Export / share | Sharing unavailable → explicit error (file still created locally) |
| Download errors | User-facing messages for offline / Wi‑Fi-only / integrity failure (no stack dumps) |
| Corrupt download queue | Reset + remove AsyncStorage key (integrity of persisted state) |
| False update prompts | `listAvailableUpdates` returns `[]` until local catalog versions are stored |

## Reviewed — already strong

| Control | Status |
| --- | --- |
| Android release signing plugin | Fail-closed (`withAndroidReleaseSigning.js`) — no silent debug signing |
| `allowBackup: false` | Set in app config |
| Permissions | Minimal INTERNET + ACCESS_NETWORK_STATE; speech/camera/photos via usage strings |
| Offline-first privacy | No mandatory cloud auth; consent gate for policies |
| Secrets in repo | Keystore examples under `credentials/`; real secrets out of band |

## Residual risks / recommendations

1. **Catalog SHA-256** — listings generally omit `sha256`, so integrity verify is skipped for many downloads. Add checksums when available; do not invent hashes.  
2. **Full-file digest memory** — verifying large weights loads all bytes; consider streaming digests if multi-GB models are added.  
3. **`expo-linking` / deep links** — package present; scheme `pocketbrain` configured; no open-redirect handler surface in app code today.  
4. **Error messages** — keep avoiding filesystem absolute paths in Alerts (current messages are guidance-oriented).  
5. **Environment variables** — `PB_UPLOAD_*` / `keystore.properties` must never be committed with real secrets.

## Conclusion

Repository security posture is appropriate for an offline-first local-AI client. Highest remaining integrity gap is **catalog checksum coverage**, not application auth/network attack surface.
