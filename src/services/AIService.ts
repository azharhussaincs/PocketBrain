import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import { modelManager } from './ModelManager';
import { inferenceEngine } from '../inference/engine/InferenceEngine';
import { getListingById } from '../data/catalog';
import type { InferenceResult, InferenceToken } from '../types/inference';
import { useSettingsStore } from '../store/settingsStore';

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Application-facing AI service. Keeps screens free of runtime details.
 *
 * Production rule: never silently invent neural answers when a real model file
 * is installed. Mock runtime is limited to Expo Go / explicit mock paths.
 */
export class AIService {
  async generateText(options: {
    modelId: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    gpuEnabled?: boolean;
    nCtx?: number;
    nThreads?: number;
    onToken?: (token: InferenceToken) => void;
    signal?: AbortSignal;
  }): Promise<InferenceResult> {
    const installed = modelManager.get(options.modelId);
    const listing = getListingById(options.modelId);
    const settings = useSettingsStore.getState();

    const gpuEnabled = options.gpuEnabled ?? settings.gpuEnabled;
    const nCtx = options.nCtx ?? settings.defaultContextSize;
    let nThreads = options.nThreads ?? settings.cpuThreads;
    if (settings.performanceMode === 'battery_saver') {
      nThreads = Math.max(1, Math.min(nThreads, 2));
    } else if (settings.performanceMode === 'performance') {
      nThreads = Math.max(nThreads, 4);
    }

    let hasInstalledFile =
      installed?.status === 'installed' && Boolean(installed.filePath);

    if (hasInstalledFile) {
      try {
        const onDisk = new File(installed!.filePath);
        if (!onDisk.exists) {
          hasInstalledFile = false;
        }
      } catch {
        hasInstalledFile = false;
      }
      if (!hasInstalledFile) {
        throw new Error(
          'The installed model file is missing from device storage. Delete it in Models if needed, then re-download from Marketplace.',
        );
      }
    }

    if (!hasInstalledFile) {
      if (!isExpoGo()) {
        throw new Error(
          'No installed model file found. Download a model from Home or Marketplace before generating.',
        );
      }
    }

    const modelPath = hasInstalledFile
      ? installed!.filePath
      : `mock://${options.modelId}`;

    const llamaReady = await inferenceEngine.isNativeRuntimeAvailable(
      listing?.preferredRuntime,
    );

    if (hasInstalledFile && !llamaReady) {
      throw new Error(
        'A model is installed, but the native llama.cpp runtime is not available in this build. Use a custom development build (`npx expo prebuild && npx expo run:android`) with llama.rn linked. PocketBrain will not invent AI answers.',
      );
    }

    await inferenceEngine.ensureModelLoaded({
      modelId: options.modelId,
      modelPath,
      preferredRuntime: listing?.preferredRuntime,
      nCtx,
      gpuEnabled:
        settings.performanceMode === 'battery_saver' ? false : gpuEnabled,
      nThreads,
    });

    if (installed) {
      await modelManager.touch(options.modelId);
    }

    return inferenceEngine.complete(
      {
        prompt: options.prompt,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        modelPath,
        modelId: options.modelId,
      },
      options.onToken,
      options.signal,
    );
  }

  getActiveRuntimeName(): string {
    return inferenceEngine.getActiveRuntime()?.displayName ?? 'None';
  }

  getDiagnostics() {
    return inferenceEngine.getDiagnostics();
  }

  async unloadModel(): Promise<void> {
    await inferenceEngine.unload();
  }

  isUsingMockRuntime(): boolean {
    return inferenceEngine.getDiagnostics().usingMock;
  }

  isExpoGoRuntime(): boolean {
    return isExpoGo();
  }
}

export const aiService = new AIService();
