import type { RuntimeId } from './models';

export interface InferenceRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stop?: string[];
  modelPath: string;
  modelId: string;
}

export interface InferenceToken {
  token: string;
  done: boolean;
}

export interface InferenceResult {
  text: string;
  tokensGenerated: number;
  durationMs: number;
  cancelled: boolean;
}

export interface RuntimeAdapter {
  id: RuntimeId;
  displayName: string;
  isAvailable(): Promise<boolean>;
  loadModel(
    path: string,
    options?: { nCtx?: number; nGpuLayers?: number; nThreads?: number },
  ): Promise<void>;
  unloadModel(): Promise<void>;
  isModelLoaded(): boolean;
  complete(
    request: InferenceRequest,
    onToken?: (token: InferenceToken) => void,
    signal?: AbortSignal,
  ): Promise<InferenceResult>;
}
