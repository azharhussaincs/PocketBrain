export const SUPPORT_EMAIL = 'support@pocketbrain.app';
export const PRIVACY_POLICY_URL = 'https://pocketbrain.app/privacy';
export const TERMS_URL = 'https://pocketbrain.app/terms';
export const APP_CATEGORY = 'Productivity';
export const LAST_UPDATED = '2026-07-30';

export const PRIVACY_POLICY = `PocketBrain Privacy Policy
Last updated: ${LAST_UPDATED}

1. Overview
PocketBrain is an offline-first AI operating system for mobile devices. We designed the app so that your chats, documents, images, audio, and downloaded models stay on your device by default.

2. Data we process on your device
• AI prompts, chat history, Workspace documents, generated files, and model files stored locally
• Device hardware information used only to recommend compatible models (RAM, storage, OS version, CPU architecture)
• Optional speech audio processed by on-device / OS speech engines when you use Speech features
• Camera or photo-library images you explicitly select for Vision / OCR / Image features

3. Data we do NOT collect by default
• No advertising identifiers for ads (no ads SDK is included)
• No analytics without your explicit opt-in
• No automatic upload of chats, documents, images, or audio to PocketBrain servers
• No sale of personal information

4. Network use
Internet access is used only when you choose to:
• Download open-source models from third-party repositories (for example Hugging Face)
• Open external links you tap (licenses, support website)
• Share exported files through the system share sheet (destination chosen by you)

5. Permissions
Microphone, camera, and media library permissions are requested only when you start a feature that needs them, with an on-screen explanation. You can revoke permissions in system settings at any time.

6. Third-party models and licenses
Downloaded models remain subject to their authors’ licenses. PocketBrain does not grant you rights beyond those licenses. Review each model’s license on its Marketplace page before download.

7. Children
PocketBrain is not directed to children under 13 (or the equivalent minimum age in your region). Do not use the app if you are under the applicable age.

8. Contact
Privacy questions: ${SUPPORT_EMAIL}
Policy URL (when published): ${PRIVACY_POLICY_URL}
`;

export const TERMS_OF_SERVICE = `PocketBrain Terms of Service
Last updated: ${LAST_UPDATED}

1. Acceptance
By using PocketBrain you agree to these Terms and the Privacy Policy.

2. The service
PocketBrain provides tools to download and run open-source AI models and create documents on your device. Features depend on your hardware and installed models.

3. Your responsibilities
• You are responsible for content you generate and for complying with model licenses
• Do not use PocketBrain for unlawful, harmful, or abusive purposes
• Do not attempt to reverse engineer native security controls except as allowed by law

4. AI outputs
AI outputs may be inaccurate or incomplete. You must review outputs before relying on them for legal, medical, financial, or safety-critical decisions.

5. No warranty
PocketBrain is provided “as is” without warranties of any kind to the extent permitted by law.

6. Limitation of liability
To the maximum extent permitted by law, PocketBrain and its contributors are not liable for indirect, incidental, or consequential damages arising from use of the app or models.

7. Third-party components
The app includes open-source libraries and may download third-party models. Those components are governed by their own licenses.

8. Changes
We may update these Terms. Continued use after an update constitutes acceptance of the revised Terms when presented in-app.

9. Contact
${SUPPORT_EMAIL}
`;

export const AI_DISCLAIMER = `AI Usage Disclaimer

PocketBrain runs AI models on your device whenever the selected model and runtime support on-device inference.

Important:
• Outputs can be wrong, biased, or fabricated
• Do not treat AI output as professional advice
• Vision, OCR, speech, and image features depend on installed models and device capabilities
• Some OS speech features may use on-device language packs; PocketBrain prefers on-device recognition when available
• Image generation requires both a compatible model and a linked native diffusion runtime — the app will never invent placeholder images

You remain responsible for how you use generated content.
`;

export const ABOUT_TEXT = `PocketBrain

An offline-first AI Operating System for mobile.

• Download and own open-source models
• Chat, Workspace documents, and multimodal tools
• No proprietary cloud AI dependency by default
• Privacy-first, Play Store–oriented design

Version and build details are shown on the About screen.
Category: ${APP_CATEGORY}
Support: ${SUPPORT_EMAIL}
`;

export const OPEN_SOURCE_LICENSES = `Major open-source components (non-exhaustive):

• React Native / Expo — MIT
• React Navigation — MIT
• React Native Paper — MIT
• Zustand — MIT
• docx — MIT
• pdf-lib — MIT
• pptxgenjs — MIT
• SheetJS Community (xlsx) — Apache-2.0
• expo-speech / expo-file-system — MIT
• expo-speech-recognition — MIT
• expo-mlkit-ocr — package license (ML Kit / Vision platform terms also apply)
• llama.cpp / llama.rn (when linked) — MIT

Full dependency licenses are available in node_modules and will be packaged for Play release notes.
Model licenses are shown per Marketplace listing and must be reviewed before download.
`;

export const CONTACT_SUPPORT = `Contact & Support

Email: ${SUPPORT_EMAIL}
Privacy policy URL: ${PRIVACY_POLICY_URL}
Terms URL: ${TERMS_URL}

When reporting an issue, include:
• App version
• Device model & OS version
• Steps to reproduce
• Whether a development build or Expo Go was used
• Relevant model names (do not attach private documents)

PocketBrain does not automatically upload diagnostics.
`;

export const FAQ = `PocketBrain FAQ

Q: Do I need an account?
A: No. PocketBrain works without accounts.

Q: Does PocketBrain send my chats to the cloud?
A: No. Chats and documents stay on your device by default. Internet is used when you download models or open links you choose.

Q: Why do I need to download a model?
A: On-device AI requires model weights stored locally. You choose which models to install, can keep several installed, and can delete any model anytime.

Q: Will Expo Go run real GGUF models?
A: No. Real GGUF inference needs a native build with llama.rn. Expo Go uses a clearly labeled development mock.

Q: Can PocketBrain generate images?
A: Only when a compatible diffusion runtime and model are installed. The app will never invent placeholder images.

Q: Is PocketBrain free?
A: Yes at launch — no ads SDK and no subscriptions are bundled.

Q: Where is the Privacy Policy?
A: In Settings → Legal, and at the published HTTPS URL configured for Google Play.
`;

export const COPYRIGHT_NOTICE = `Copyright & Trademark Notice

© ${new Date().getFullYear()} PocketBrain contributors. All rights reserved.

“PocketBrain” is used as the product name of this offline-first AI application.
Third-party model names, logos, and trademarks belong to their respective owners.
Open-source libraries are used under their respective licenses (see Open Source Licenses).

This notice does not grant permission to misrepresent PocketBrain as a cloud AI service or to strip privacy disclosures from redistributed builds.
`;
