# Model Integrity Report — Phase 17

**Date:** 2026-07-31 · PocketBrain **1.9.3**

---

## Mechanism (ready)

| Component | Behavior |
| --- | --- |
| `ModelListing.sha256?` | Optional field on catalog entries |
| `ModelManager.downloadAndInstall` | Passes `listing.sha256` as `expectedSha256` |
| `DownloadManager.completeWithOptionalVerify` | If expected hash present → SHA-256 digest → delete file on mismatch |
| Filename sanitize | `sanitizeFileName` on model paths |

**When `sha256` is set, verification runs.** When absent, download completes without integrity verify (documented limitation).

---

## Why catalog hashes remain blank

1. Catalog `downloadUrl` values point at specific Hugging Face paths (e.g. `HuggingFaceTB/SmolLM2-135M-Instruct-GGUF/...`).  
2. Public SHA256 values found for **other** republishers (e.g. bartowski, unsloth) are **not** proven identical to the HuggingFaceTB file bytes at our URL.  
3. Inventing or copying a hash from a different repo would cause **every** install to fail integrity checks — worse than optional verify.  
4. Phase 17 rule: **never invent hashes.**

Therefore all catalog entries intentionally omit `sha256` until a release engineer confirms the digest for the **exact** URL + revision (Hugging Face file page / `sha256sum` of a downloaded artifact matching that URL).

---

## How to add a hash safely (external / ops)

1. Download the file from the **exact** `downloadUrl`.  
2. Compute `sha256sum` (or use the HF file page SHA256 for that same path/revision).  
3. Set `sha256: '<hex>'` on that listing only.  
4. Run a test install and confirm state reaches `verifying` → `completed`.  
5. Document the source URL + revision in this file’s changelog section below.

---

## Memory note (residual)

`verifyFileSha256` currently loads full file bytes into memory. Acceptable for current ~100–200 MB starters; for multi-GB weights, prefer streaming digest before enabling those hashes on low-RAM devices. Not changed in Phase 17 (scope).

---

## Status

| Question | Answer |
| --- | --- |
| Integrity **mechanism** production-ready? | **Yes** (code path proven by design) |
| Integrity **enforced** for all catalog downloads today? | **No** — hashes blank by policy |
| Invented hashes present? | **No** |
