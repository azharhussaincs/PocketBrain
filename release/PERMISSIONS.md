# Permissions audit — PocketBrain

Least privilege. Runtime dangerous permissions are requested at feature entry with rationale (`PermissionService`), never at cold start.

## Declared / merged permissions

| Permission | Why needed | When requested | If denied |
| --- | --- | --- | --- |
| `INTERNET` | Model downloads; open HTTPS legal/support links | Manifest (normal) | Downloads/links fail; local content still usable |
| `ACCESS_NETWORK_STATE` | Wi‑Fi-only download preference / connectivity checks | Manifest (normal) | Conservative download gating may apply |
| `RECORD_AUDIO` | Speech recognition / recording features | Runtime when user starts Speech | Speech features unavailable; rest of app works |
| `MODIFY_AUDIO_SETTINGS` | Audio session for speech/AV modules | Merged via AV/speech stack | Speech/AV may degrade |
| `CAMERA` (via image-picker merge) | Capture for Vision/OCR | Runtime when user starts camera capture | Use gallery or skip Vision/OCR |
| Photos / media (picker) | Select images for Vision/OCR | Runtime when user picks media | Skip image features |
| `READ/WRITE_EXTERNAL_STORAGE` (maxSdk 32) | Legacy share/export on older Android | Manifest limited to API ≤32 | Modern scoped storage paths still used on newer OS |
| `VIBRATE` | System/UI feedback from RN stack | Manifest | No functional blocker |
| `SYSTEM_ALERT_WINDOW` | **Removed** via `blockedPermissions` / `tools:node="remove"` | N/A | Not used |

## Not used

- Location, contacts, SMS, call log, exact alarm scheduling for ads, Bluetooth admin, etc.

## Policy alignment

- Matches User Data Policy: sensitive perms tied to user-facing features with disclosure.
- No background mic/camera listening.
- No advertising ID permission/SDK.
