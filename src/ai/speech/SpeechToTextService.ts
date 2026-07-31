import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export type SttPartialHandler = (text: string, isFinal: boolean) => void;

/**
 * Speech-to-text using platform recognizers.
 * Prefers on-device recognition for Play Store privacy alignment.
 */
export class SpeechToTextService {
  private listening = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      return result.granted === true;
    } catch {
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      return result.granted === true;
    } catch {
      return false;
    }
  }

  supportsOnDevice(): boolean {
    try {
      return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    } catch {
      return false;
    }
  }

  isAvailable(): boolean {
    try {
      return typeof ExpoSpeechRecognitionModule.start === 'function';
    } catch {
      return false;
    }
  }

  async start(options: {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    requiresOnDeviceRecognition?: boolean;
  } = {}): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) {
      throw new Error(
        'Microphone / speech permission denied. Enable it in system settings to transcribe offline.',
      );
    }

    const preferOnDevice =
      options.requiresOnDeviceRecognition ?? this.supportsOnDevice();

    this.listening = true;
    ExpoSpeechRecognitionModule.start({
      lang: options.lang ?? 'en-US',
      interimResults: options.interimResults ?? true,
      continuous: options.continuous ?? false,
      requiresOnDeviceRecognition: preferOnDevice,
      addsPunctuation: true,
    });
  }

  stop(): void {
    try {
      ExpoSpeechRecognitionModule.stop();
    } finally {
      this.listening = false;
    }
  }

  abort(): void {
    try {
      ExpoSpeechRecognitionModule.abort();
    } finally {
      this.listening = false;
    }
  }

  isListening(): boolean {
    return this.listening;
  }
}

export { useSpeechRecognitionEvent };
export const speechToTextService = new SpeechToTextService();
