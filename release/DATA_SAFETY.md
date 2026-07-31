# Data Safety — PocketBrain (Play Console mapping)

**Version covered:** 1.9.3  
**Rule:** This document must match the Play Console Data Safety form exactly. Update both together if SDKs change.

## Does your app collect or share user data?

**Collect to PocketBrain servers?** **No.**  
PocketBrain has **no backend** and ships **no analytics / crash / ads SDKs**.

**Process data on device?** **Yes** — chats, documents, models, and optional media stay local unless the user explicitly shares via the system share sheet or downloads models.

## Data types

| Data type | Collected by app developer? | Shared? | On-device processing | Notes |
| --- | --- | --- | --- | --- |
| Name / email / phone / address | No | No | — | No accounts |
| User IDs | No | No | — | |
| Approximate / precise location | No | No | — | |
| Payment info | No | No | — | Free, no IAP at launch |
| Photos / videos | No (not uploaded) | No | Optional when user picks image for Vision/OCR | Remains on device unless user shares |
| Audio files | No (not uploaded) | No | Optional when user starts Speech | Mic permission at feature time |
| Files / docs | No (not uploaded) | No | Workspace + Files local | User may export/share |
| App interactions (to developer) | No | No | Local UI state only | No analytics SDK |
| Crash logs (to developer) | No | No | — | No crash SDK |
| Device IDs / Advertising ID | No | No | — | No ads |
| Diagnostics to developer | No | No | — | |

## Ephemeral processing

- Speech may be handled by **on-device / OS** recognition engines when the user starts Speech.
- Camera/photos used only when the user starts Vision/OCR.
- PocketBrain does **not** upload these to PocketBrain servers.

## Data sharing

- **Not shared** with third parties by PocketBrain for advertising/analytics.
- **User-initiated model downloads** contact third-party model hosts (e.g. Hugging Face) over HTTPS when the user starts a download. Disclose as optional user-initiated network transfer of **model files**, not chat content.

## Security practices

| Practice | Answer |
| --- | --- |
| Data encrypted in transit | Yes for HTTPS downloads / opened links |
| Encryption at rest | Relies on Android app sandbox / device encryption |
| Users can request deletion | Yes — delete models/files in-app; uninstall / clear storage |
| Committed to Play Families | No |

## Independent security review

No third-party security review claimed.

## Retention

Local data retained until the user deletes it or uninstalls the app. No cloud retention by PocketBrain.

## User controls

- Deny mic/camera/photos → related features disabled with messaging; rest of app continues
- Disable model downloads in Settings → Privacy
- Offline mode setting blocks network features when enabled
- Delete installed models anytime

## Ads / purchase declarations (related)

- Ads: **No**
- In-app purchases: **No** (launch)
