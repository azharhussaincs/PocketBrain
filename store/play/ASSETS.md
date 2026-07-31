# Play Store assets

| Asset | Path | Status |
| --- | --- | --- |
| App icon 1024×1024 | `assets/icon.png` | Ready |
| Adaptive icon layers | `assets/android-icon-*.png` | Ready |
| Splash | `assets/splash-icon.png` + teal `#0F766E` | Ready |
| High-res Play icon 512×512 | `assets/play/icon-512.png` | Ready |
| Feature graphic 1024×500 | `assets/play/feature-graphic.png` | Ready |
| Phone screenshots (min 2) | — | **Blocked** — requires real device/emulator capture |
| Tablet screenshots | — | **Blocked** — optional until tablet listing enabled |

## Screenshot capture instructions (device QA)

On a native build (`npx expo run:android`):

1. Fresh install → onboarding consent
2. Home task picker
3. Marketplace with a model card
4. Chat thread with a local reply (or labeled mock in Expo Go only for UI layout)
5. Workspace document
6. Files explorer
7. Download Center / Storage

Export PNGs into `assets/play/screenshots/` and tick items in `LISTING.md`.

Do **not** submit placeholder or fabricated UI screenshots.
