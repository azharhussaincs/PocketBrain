# PocketBrain Brand Guidelines

**Version:** 1.6.0 · **Updated:** 2026-07-30  
**Artwork:** Original vector mark (brain + pocket / privacy shield). No third-party logos.

## Concept

Offline AI that stays in your pocket — privacy-first, local intelligence, minimal Material 3 aesthetics.

## Logo files (SVG masters)

| File | Use |
| --- | --- |
| `icon-master.svg` | 1024 master square mark |
| `logo.svg` | Default square logo |
| `logo-light.svg` | On light `#F8FAFC` canvas |
| `logo-dark.svg` | On dark `#0B1220` canvas |
| `logo-monochrome.svg` | Black/white silhouette |
| `logo-transparent.svg` | Mark only, no page fill |
| `logo-horizontal.svg` | Mark + wordmark |
| `adaptive-foreground.svg` | Android adaptive FG (safe-zone padded) |
| `adaptive-background.svg` | Solid teal `#0F766E` |
| `notification-icon.svg` | White glyph for status bar |
| `splash.svg` | Splash composition |

Raster exports used by Expo live under `assets/*.png` and `assets/play/*.png`. Prefer regenerating rasters from SVG masters after logo edits (`scripts/export-brand-assets.mjs`).

## Color palette

### Light

| Token | Hex | Contrast notes |
| --- | --- | --- |
| Primary | `#0F766E` | On white text: use white on primary buttons |
| Primary container | `#CCFBF1` | Soft surfaces |
| Secondary | `#1E293B` | Body emphasis |
| Tertiary | `#EA580C` | Sparse accent only |
| Background | `#F8FAFC` | App canvas |
| On-surface | `#0F172A` | Body text — aim ≥4.5:1 on background |
| Outline | `#94A3B8` | Borders |

### Dark

| Token | Hex |
| --- | --- |
| Primary | `#2DD4BF` |
| Background | `#0B1220` |
| Surface | `#111827` |
| On-surface | `#F8FAFC` |

Avoid purple-indigo AI clichés. Teal communicates privacy/trust.

## Typography

- UI: system / Material 3 via React Native Paper
- Marketing wordmark: system sans, bold
- Dynamic type: supported; capped at 2× in app for layout safety

## Spacing & safe margins

- Base unit: **8**
- Screen padding: **16**
- Adaptive icon: keep critical artwork inside center **~66%**
- Touch targets: **≥48 dp** where practical

## Iconography

- Navigation: Material Community outline icons
- Notification: white alpha silhouette only
- Do not place fine text inside the launcher mark

## Logo usage

**Do:** use teal mark on light/dark approved backgrounds; keep clear space ≈ ⅛ mark height.  
**Don’t:** recolor arbitrarily, add drop shadows/glows, stretch, or place on busy photography without a solid scrim.

## Accessibility

- Prefer `onPrimary` white on `#0F766E` buttons
- Dark mode primary `#2DD4BF` on `#0B1220` for large text/icons
- Never rely on color alone for errors (pair with text)
- TalkBack labels required on icon-only controls

## Export specifications

| Target | Size | Source |
| --- | --- | --- |
| Play high-res icon | 512×512 PNG | `icon-master.svg` |
| App icon | 1024×1024 PNG | `icon-master.svg` |
| Adaptive FG/BG | 1024→512 PNG | `adaptive-*.svg` |
| Monochrome | 432×432 PNG | `logo-monochrome.svg` |
| Feature graphic | 1024×500 PNG | `assets/play/feature-graphic.svg` |
| Notification | 96×96 PNG | `notification-icon.svg` |
| Splash | 1024×1024 PNG | `splash.svg` |

Optional polish: refine vectors in Figma/Illustrator or regenerate photorealistic marketing stills with an image tool — then re-export PNGs into `assets/` without changing package IDs.
