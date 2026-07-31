import { Alert, Linking, Platform } from 'react-native';
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export type PermissionKind = 'microphone' | 'camera' | 'mediaLibrary' | 'speech';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  kind: PermissionKind;
}

/**
 * Runtime permissions with user-facing rationale (Play Store best practice).
 * Never request at cold start — call from feature entry points only.
 */
export class PermissionService {
  async ensure(
    kind: PermissionKind,
    rationale: string,
  ): Promise<PermissionResult> {
    const proceed = await confirmRationale(kind, rationale);
    if (!proceed) {
      return { granted: false, canAskAgain: true, kind };
    }

    switch (kind) {
      case 'microphone':
        return this.requestMicrophone();
      case 'speech':
        return this.requestSpeech();
      case 'camera':
        return this.requestCamera();
      case 'mediaLibrary':
        return this.requestMediaLibrary();
      default:
        return { granted: false, canAskAgain: false, kind };
    }
  }

  private async requestMicrophone(): Promise<PermissionResult> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    });
    const result = await Audio.requestPermissionsAsync();
    return {
      kind: 'microphone',
      granted: result.granted,
      canAskAgain: result.canAskAgain,
    };
  }

  private async requestSpeech(): Promise<PermissionResult> {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return {
      kind: 'speech',
      granted: result.granted === true,
      canAskAgain: result.canAskAgain !== false,
    };
  }

  private async requestCamera(): Promise<PermissionResult> {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    return {
      kind: 'camera',
      granted: result.granted,
      canAskAgain: result.canAskAgain,
    };
  }

  private async requestMediaLibrary(): Promise<PermissionResult> {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return {
      kind: 'mediaLibrary',
      granted: result.granted,
      canAskAgain: result.canAskAgain,
    };
  }

  openSystemSettings(): void {
    void Linking.openSettings();
  }
}

function confirmRationale(kind: PermissionKind, rationale: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      permissionTitle(kind),
      `${rationale}\n\nPocketBrain processes this data on-device. Nothing is uploaded unless you explicitly download models over the network.`,
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: Platform.OS === 'ios' ? 'Continue' : 'Allow', onPress: () => resolve(true) },
      ],
    );
  });
}

function permissionTitle(kind: PermissionKind): string {
  switch (kind) {
    case 'microphone':
    case 'speech':
      return 'Microphone access';
    case 'camera':
      return 'Camera access';
    case 'mediaLibrary':
      return 'Photo library access';
    default:
      return 'Permission needed';
  }
}

export const permissionService = new PermissionService();
