import * as Speech from 'expo-speech';

export interface TtsOptions {
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export class TextToSpeechService {
  async getVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch {
      return [];
    }
  }

  async speak(options: TtsOptions): Promise<void> {
    const text = options.text.trim();
    if (!text) return;

    await this.stop();
    Speech.speak(text, {
      language: options.language ?? 'en-US',
      rate: clamp(options.rate ?? 1, 0.5, 2),
      pitch: clamp(options.pitch ?? 1, 0.5, 2),
      voice: options.voice,
      onDone: options.onDone,
      onError: (event) =>
        options.onError?.(new Error(String((event as { error?: string })?.error ?? 'TTS error'))),
    });
  }

  async stop(): Promise<void> {
    await Speech.stop();
  }

  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  /** Always available via OS voices — no marketplace model required. */
  isAvailable(): boolean {
    return true;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export const textToSpeechService = new TextToSpeechService();
