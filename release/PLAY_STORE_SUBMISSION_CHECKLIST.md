# Google Play Submission Checklist

## Console setup

- [ ] Create app `com.pocketbrain.app` (or confirm package)
- [ ] App category: Productivity
- [ ] Free app
- [ ] Privacy Policy URL live (HTTPS) — currently **blocker**
- [ ] App access: all features available without login
- [ ] Ads: No
- [ ] Content rating completed
- [ ] Target audience / news apps declarations completed honestly
- [ ] Data Safety form completed from `DATA_SAFETY_CHECKLIST.md`
- [ ] Government apps / COVID / etc. declarations: No where applicable

## Store listing

- [ ] Short description ≤80 chars (`store/play/LISTING.md`)
- [ ] Full description
- [ ] App icon 512
- [ ] Feature graphic 1024×500
- [ ] Phone screenshots (min 2)
- [ ] Tablet screenshots if opted in
- [ ] Contact email `support@pocketbrain.app`

## Release artifact

- [ ] AAB built with **release** signing (not debug)
- [ ] `versionName` 1.5.0 / `versionCode` 7 (or higher)
- [ ] targetSdk ≥ Play requirement (configured 35)
- [ ] minSdk 26
- [ ] ProGuard/R8 mapping retained if minify enabled later
- [ ] Smoke-tested AAB on a physical device before rollout

## Rollout

- [ ] Internal testing track first
- [ ] Closed testing (optional)
- [ ] Production staged rollout (recommended 10% → 100%)
