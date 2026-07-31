import { Platform } from 'react-native';

export interface OcrResult {
  text: string;
  blocks: Array<{ text: string }>;
  engine: 'mlkit' | 'unavailable';
}

/**
 * On-device OCR via expo-mlkit-ocr (ML Kit / Apple Vision).
 * Requires a development build — Expo Go returns a clear unavailable state (no fake text).
 */
export class OcrService {
  isAvailable(): boolean {
    if (Platform.OS === 'web') return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-mlkit-ocr') as {
        isSupported?: () => boolean;
      };
      return typeof mod.isSupported === 'function' ? mod.isSupported() : true;
    } catch {
      return false;
    }
  }

  async recognize(imageUri: string): Promise<OcrResult> {
    if (!this.isAvailable()) {
      throw new Error(
        'On-device OCR requires a development build (expo-mlkit-ocr). Run `npx expo prebuild` and install on a device.',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { recognizeText } = require('expo-mlkit-ocr') as {
      recognizeText: (uri: string) => Promise<{
        text: string;
        blocks?: Array<{ text: string }>;
      }>;
    };

    const result = await recognizeText(imageUri);
    return {
      text: result.text?.trim() ?? '',
      blocks: (result.blocks ?? []).map((b) => ({ text: b.text })),
      engine: 'mlkit',
    };
  }
}

export const ocrService = new OcrService();
