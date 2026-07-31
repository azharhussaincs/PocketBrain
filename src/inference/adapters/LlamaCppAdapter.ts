import type { InferenceRequest, InferenceResult, InferenceToken, RuntimeAdapter } from '../../types/inference';

type LlamaModule = {
  initLlama: (opts: Record<string, unknown>) => Promise<LlamaContext>;
};

type LlamaContext = {
  completion: (
    params: Record<string, unknown>,
    onToken?: (data: { token: string }) => void,
  ) => Promise<{ text: string }>;
  stopCompletion?: () => void;
  release: () => Promise<void>;
};

/**
 * llama.cpp adapter via llama.rn.
 * Requires a custom Expo / native build (New Architecture). Expo Go stays unavailable.
 */
export class LlamaCppAdapter implements RuntimeAdapter {
  id = 'llama.cpp' as const;
  displayName = 'llama.cpp';
  private context: LlamaContext | null = null;
  private loadedPath: string | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      // Dynamic require so Metro can still resolve when native artifacts are present.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('llama.rn');
      return true;
    } catch {
      return false;
    }
  }

  async loadModel(
    path: string,
    options?: { nCtx?: number; nGpuLayers?: number; nThreads?: number },
  ): Promise<void> {
    if (path.startsWith('mock://')) {
      throw new Error('llama.cpp cannot load mock:// paths');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('llama.rn') as LlamaModule;

    if (this.context) {
      await this.unloadModel();
    }

    this.context = await mod.initLlama({
      model: path,
      n_ctx: options?.nCtx ?? 2048,
      n_gpu_layers: options?.nGpuLayers ?? 99,
      n_threads: options?.nThreads,
    });
    this.loadedPath = path;
  }

  async unloadModel(): Promise<void> {
    if (this.context) {
      try {
        this.context.stopCompletion?.();
      } catch {
        // ignore
      }
      await this.context.release();
      this.context = null;
    }
    this.loadedPath = null;
  }

  isModelLoaded(): boolean {
    return this.context != null && this.loadedPath != null;
  }

  async complete(
    request: InferenceRequest,
    onToken?: (token: InferenceToken) => void,
    signal?: AbortSignal,
  ): Promise<InferenceResult> {
    if (!this.context) {
      throw new Error('llama.cpp model is not loaded');
    }

    const started = Date.now();
    let text = '';
    let cancelled = false;
    const ctx = this.context;

    const abortHandler = () => {
      cancelled = true;
      try {
        ctx.stopCompletion?.();
      } catch {
        // best-effort cancel
      }
    };
    signal?.addEventListener('abort', abortHandler);

    try {
      const system = request.systemPrompt
        ? `${request.systemPrompt}\n\n`
        : 'You are PocketBrain, a private on-device assistant. Stay helpful and concise.\n\n';
      const prompt = `${system}User: ${request.prompt}\nAssistant:`;

      const result = await ctx.completion(
        {
          prompt,
          n_predict: request.maxTokens ?? 512,
          temperature: request.temperature ?? 0.7,
          stop: request.stop ?? ['User:', '</s>'],
        },
        (data) => {
          if (signal?.aborted || cancelled) {
            cancelled = true;
            return;
          }
          text += data.token;
          onToken?.({ token: data.token, done: false });
        },
      );

      if (!text && result?.text) {
        text = result.text;
      }
      onToken?.({ token: '', done: true });

      return {
        text,
        tokensGenerated: text.split(/\s+/).filter(Boolean).length,
        durationMs: Date.now() - started,
        cancelled,
      };
    } finally {
      signal?.removeEventListener('abort', abortHandler);
    }
  }
}
