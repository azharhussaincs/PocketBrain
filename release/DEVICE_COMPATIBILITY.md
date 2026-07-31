# Device compatibility — PocketBrain

| Class | Example profile | Android | RAM | Expected behavior |
| --- | --- | --- | --- | --- |
| Low RAM | Entry phones | 8.0+ (API 26+) | 3–4 GB | Starter / tiny GGUF only; expect slower tokens; avoid large models |
| Mid-range | Common targets | 12–15 | 6–8 GB | Small/medium quant models; primary QA target |
| Flagship | High-end | 13–15 | 8–16 GB | Larger quants; better tokens/s if GPU/OpenCL available |
| Tablet | 7–10"+ | 12–15 | 4–8 GB+ | UI supported (`orientation: default`); capture tablet screenshots only if listing enabled |

## Minimum (config)

- **minSdkVersion:** 26 (Android 8.0)
- **targetSdkVersion:** 35

## Recommended for local inference

- 6 GB+ RAM
- Free storage ≥ 2× largest model you plan to install
- Wi‑Fi for first model download
- Native release build with `llama.rn` linked

## Not claimed

Device classes above are **guidance**. Physical matrix testing in this environment: **BLOCKED** (no device attached; incomplete host Android SDK for emulator).
