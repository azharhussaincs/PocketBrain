# Data Safety checklist (Play Console)

Fill the Play Data Safety form using these answers. Re-verify after any SDK change.

## Data collection

| Data type | Collected? | Notes |
| --- | --- | --- |
| Personal info / account | No | No accounts |
| Financial | No | |
| Location | No | |
| Web browsing | No | |
| App activity (in PocketBrain servers) | No | Local only |
| App info and performance to PocketBrain | No | No analytics SDK |
| Device IDs for ads | No | No ads SDK |

## Ephemeral / on-device processing

- Speech audio may be processed by **on-device / OS** engines when user starts Speech
- Camera/photos used only when user starts Vision/OCR
- These are not uploaded by PocketBrain to PocketBrain servers

## Data sharing

- Shared with third parties by PocketBrain? **No** (default)
- Model downloads contact third-party hosts (e.g. Hugging Face) when user starts a download — disclose as user-initiated network transfer of model files, not chat content

## Security practices

- Data encrypted in transit: HTTPS for downloads / opened links
- Users can delete data: uninstall / clear storage / delete models & files in-app

## Ads / purchase

- Approx. ads: **No**
- In-app purchases: **No** (launch)
