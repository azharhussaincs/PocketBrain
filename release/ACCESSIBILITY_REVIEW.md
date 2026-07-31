# Accessibility review — Phase 10 / updated Phase 12

| Area | Status | Notes |
| --- | --- | --- |
| TalkBack labels | **Partial** | Home cards, Chat icons, ResponseActions, consent, Marketplace search, EmptyState; Phase 12 added tab `tabBarAccessibilityLabel`s and EmptyState CTA labels |
| Font scaling | **Partial** | System scaling respected; capped at 2× in `App.tsx` for layout safety |
| Color contrast | **Reviewed (static)** | Teal `#0F766E` + white on primary; dark `#2DD4BF` on `#0B1220`. Full WCAG meter not run on device |
| Touch targets | **Partial** | Tab bar minHeight 56; Phase 12 raised ResponseActions icon hit area to min 44×44 and EmptyState CTA `minHeight` 44; dense 8-tab bar remains a risk |
| Focus order | **Not device-verified** | Standard React Navigation order expected |
| Screen rotation | **Supported** | `orientation: default` |
| Tablet layouts | **Basic** | No dedicated tablet breakpoints; usable but not optimized |

## Remaining limitations

- Full TalkBack matrix on hardware: **not executed** (see `DEVICE_QA_CHECKLIST.md` I5)
- Color-blind simulation: **not executed**
- Keyboard/D-pad navigation on Android TV: **out of scope**
