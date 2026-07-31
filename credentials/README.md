# Upload credentials (local only)

1. Generate a keystore (see `release/APP_SIGNING.md`).
2. Save it as `credentials/pocketbrain-upload.jks` (or another path you control).
3. Copy `keystore.properties.example` → `android/keystore.properties` after `npx expo prebuild`.
4. Or export `PB_UPLOAD_*` environment variables instead of a properties file.

Never commit `*.jks`, `*.keystore`, or real `keystore.properties` files.
