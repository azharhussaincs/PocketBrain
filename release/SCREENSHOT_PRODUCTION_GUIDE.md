# Screenshot Production Guide — Phase 18

**Rule:** Capture on a **real device** (or OEM emulator only if Play accepts — prefer physical).  
**Rule:** Never generate, AI-draw, or commit fabricated phone screenshots.  
**Output folder (when real):** `assets/play/screenshots/` (currently README-only by design).

Also see: `SCREENSHOT_CAPTURE_GUIDE.md`, templates under `assets/play/screenshot-templates/`.

---

## Device & framing

| Spec | Recommendation |
| --- | --- |
| Form factor | Phone (primary) |
| Orientation | **Portrait** |
| Resolution | Native panel; export PNG |
| Play requirement | ≥2 phone screenshots before Production listing |
| Status bar | Clean: full battery, wifi/cell, no personal notifications; avoid demo clock if policy-sensitive |
| Theme | **Light mode** required set; dark optional second set |
| Nav | Show real PocketBrain UI — no mock frames over fake content |

---

## Screen order (suggested 6; minimum 2)

| # | Screen | Sample data | Show |
| --- | --- | --- | --- |
| 1 | Home — task grid | Default tasks visible | Brand clarity |
| 2 | Marketplace | Starter model card + honest size/RAM | Discovery |
| 3 | Chat | Short offline conversation (no secrets) | Core AI |
| 4 | Workspace / document | Short doc title visible | Productivity |
| 5 | Downloads or Models | Completed starter install | Local models |
| 6 | Settings / Privacy entry | Theme + privacy affordance | Trust |

Capture **at least #1 and #3** for Internal listing if uploading early; complete set before Production.

---

## Sample data requirements

- Use **synthetic** chat text (no real user PII).  
- Prefer starter model already downloaded so Chat is not empty-state only for shot #3.  
- Do not show debug overlays, Expo QR, or `adb` chrome.  
- Vision shot optional; if shown, Limited Vision labeling must be visible or omit Vision shot.

---

## Naming convention

```text
assets/play/screenshots/
  phone-01-home-light.png
  phone-02-marketplace-light.png
  phone-03-chat-light.png
  phone-04-workspace-light.png
  phone-05-models-light.png
  phone-06-settings-light.png
  phone-01-home-dark.png   # optional
```

Metadata sidecar optional: `MANIFEST.txt` with device model + date (operator-authored).

---

## Capture steps

1. Install release/candidate build.  
2. Complete consent.  
3. Download starter model (for Chat/Models shots).  
4. Set English / light theme.  
5. Clear notifications.  
6. System screenshot or `adb exec-out screencap -p > file.png`.  
7. Crop only if needed to remove soft-keys inconsistently — prefer full device frames Play accepts.  
8. Visually QA: no crash dialogs, no “Limited Vision” overclaim, no debug.

---

## Success criteria

| Check | Pass |
| --- | --- |
| Count | ≥2 phone PNGs for Production listing |
| Realism | Captured from running app |
| Honesty | No fake multimodal claims in frame |
| Naming | Follows convention |
| Repo | Only commit **real** captures when intentionally publishing assets |

---

## Failure criteria

- Mockups labeled as screenshots  
- Stock photos  
- Screenshots from unrelated apps  
- Empty black frames  

**This guide does not create PNG files.**
