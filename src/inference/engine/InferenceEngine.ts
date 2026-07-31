import type { RuntimeAdapter } from '../../types/inference';
import type { RuntimeId } from '../../types/models';
import type { InferenceRequest, InferenceResult, InferenceToken } from '../../types/inference';
import { LlamaCppAdapter } from '../adapters/LlamaCppAdapter';
import { MockRuntimeAdapter } from '../adapters/MockRuntimeAdapter';
import {
  coreMlAdapter,
  mediaPipeAdapter,
  mlcAdapter,
  onnxAdapter,
} from '../adapters/FutureRuntimeAdapters';

export interface RuntimeDiagnostics {
  activeRuntime: string | null;
  loadedModelId: string | null;
  modelLoaded: boolean;
  lastDurationMs: number | null;
  lastTokensGenerated: number | null;
  lastCancelled: boolean;
  usingMock: boolean;
  llamaAvailable: boolean | null;
}

/**
 * Selects the best available runtime and routes inference requests.
 */
export class InferenceEngine {
  private adapters: RuntimeAdapter[];
  private active: RuntimeAdapter | null = null;
  private loadedModelId: string | null = null;
  private lastDurationMs: number | null = null;
  private lastTokensGenerated: number | null = null;
  private lastCancelled = false;
  private llamaAvailable: boolean | null = null;

  constructor(adapters?: RuntimeAdapter[]) {
    this.adapters =
      adapters ??
      [
        new LlamaCppAdapter(),
        onnxAdapter,
        mediaPipeAdapter,
        coreMlAdapter,
        mlcAdapter,
        new MockRuntimeAdapter(),
      ];
  }

  async selectRuntime(preferred?: RuntimeId): Promise<RuntimeAdapter> {
    const llama = this.adapters.find((a) => a.id === 'llama.cpp');
    if (llama) {
      this.llamaAvailable = await llama.isAvailable();
    }

    if (preferred) {
      const preferredAdapter = this.adapters.find((a) => a.id === preferred);
      if (preferredAdapter && (await preferredAdapter.isAvailable())) {
        this.active = preferredAdapter;
        return preferredAdapter;
      }
    }

    for (const adapter of this.adapters) {
      if (adapter.id === 'mock') continue;
      if (await adapter.isAvailable()) {
        this.active = adapter;
        return adapter;
      }
    }

    const mock = this.adapters.find((a) => a.id === 'mock') ?? new MockRuntimeAdapter();
    this.active = mock;
    return mock;
  }

  getActiveRuntime(): RuntimeAdapter | null {
    return this.active;
  }

  getLoadedModelId(): string | null {
    return this.loadedModelId;
  }

  getDiagnostics(): RuntimeDiagnostics {
    return {
      activeRuntime: this.active?.displayName ?? null,
      loadedModelId: this.loadedModelId,
      modelLoaded: this.active?.isModelLoaded() ?? false,
      lastDurationMs: this.lastDurationMs,
      lastTokensGenerated: this.lastTokensGenerated,
      lastCancelled: this.lastCancelled,
      usingMock: this.active?.id === 'mock',
      llamaAvailable: this.llamaAvailable,
    };
  }

  async isNativeRuntimeAvailable(preferred?: RuntimeId): Promise<boolean> {
    if (preferred) {
      const preferredAdapter = this.adapters.find((a) => a.id === preferred);
      if (preferredAdapter && preferredAdapter.id !== 'mock') {
        return preferredAdapter.isAvailable();
      }
    }
    for (const adapter of this.adapters) {
      if (adapter.id === 'mock') continue;
      if (await adapter.isAvailable()) return true;
    }
    return false;
  }

  async ensureModelLoaded(options: {
    modelId: string;
    modelPath: string;
    preferredRuntime?: RuntimeId;
    nCtx?: number;
    gpuEnabled?: boolean;
    nThreads?: number;
  }): Promise<RuntimeAdapter> {
    const runtime = await this.selectRuntime(options.preferredRuntime);
    if (this.loadedModelId === options.modelId && runtime.isModelLoaded()) {
      return runtime;
    }
    // Unload previous model before switching (memory hygiene)
    if (this.loadedModelId && this.loadedModelId !== options.modelId && this.active) {
      try {
        await this.active.unloadModel();
      } catch {
        // recover by continuing load
      }
    }
    await runtime.loadModel(options.modelPath, {
      nCtx: options.nCtx,
      nGpuLayers: options.gpuEnabled === false ? 0 : 99,
      nThreads: options.nThreads,
    });
    this.loadedModelId = options.modelId;
    return runtime;
  }

  async complete(
    request: InferenceRequest,
    onToken?: (token: InferenceToken) => void,
    signal?: AbortSignal,
  ): Promise<InferenceResult> {
    if (!this.active) {
      await this.selectRuntime();
    }
    try {
      const result = await this.active!.complete(request, onToken, signal);
      this.lastDurationMs = result.durationMs;
      this.lastTokensGenerated = result.tokensGenerated;
      this.lastCancelled = result.cancelled;
      return result;
    } catch (error) {
      // Automatic recovery: unload and surface a clean error
      try {
        await this.unload();
      } catch {
        // ignore
      }
      throw error;
    }
  }

  async unload(): Promise<void> {
    if (this.active) {
      await this.active.unloadModel();
    }
    this.loadedModelId = null;
  }
}

export const inferenceEngine = new InferenceEngine();
