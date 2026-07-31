import { Directory, File, Paths } from 'expo-file-system';
import { modelRegistry } from '../registry/ModelRegistry';
import { aiService } from '../../services/AIService';
import { createId } from '../../utils/format';

export interface ImageGenRequest {
  prompt: string;
  negativePrompt?: string;
  initImageUri?: string;
  mode: 'text2img' | 'img2img' | 'variation';
  modelId?: string;
  width?: number;
  height?: number;
  seed?: number;
  signal?: AbortSignal;
}

export interface ImageGenResult {
  status: 'queued_native' | 'requires_model' | 'requires_runtime';
  message: string;
  /** Path reserved for the output when a native diffusion runtime is linked. */
  outputPath?: string;
  modelId?: string;
  /** Structured job metadata for inpainting / upscaling pipelines. */
  job: {
    id: string;
    prompt: string;
    negativePrompt?: string;
    mode: ImageGenRequest['mode'];
    width: number;
    height: number;
    seed: number;
    initImageUri?: string;
  };
}

function getImageGenDir(): Directory {
  const dir = new Directory(Paths.document, 'generated-images');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Image generation service.
 *
 * Production rules:
 * - Never returns fake/placeholder images.
 * - Requires an installed image-generation model AND a linked native diffusion runtime.
 * - Exposes inpainting / upscaling-ready job metadata for future runtimes (ONNX / MLC / custom).
 * - Uses local AI only to refine prompts when a text model is available (optional).
 */
export class ImageGenerationService {
  listModels(installedOnly = true) {
    return modelRegistry.listByCapability('image_generation', installedOnly);
  }

  hasModel(): boolean {
    return this.listModels(true).length > 0;
  }

  async isNativeRuntimeAvailable(): Promise<boolean> {
    try {
      // Reserved for future: require('pocketbrain-diffusion') or similar native module.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('pocketbrain-diffusion');
      return true;
    } catch {
      return false;
    }
  }

  async generate(request: ImageGenRequest): Promise<ImageGenResult> {
    const prompt = request.prompt.trim();
    if (!prompt) {
      throw new Error('Enter a text prompt to generate an image.');
    }

    const models = this.listModels(true);
    const model = request.modelId
      ? models.find((m) => m.id === request.modelId)
      : models[0];

    if (!model) {
      return {
        status: 'requires_model',
        message:
          'Install an image generation model from the Marketplace first. PocketBrain will warn about RAM/storage before download.',
        job: this.buildJob(request, prompt),
      };
    }

    const native = await this.isNativeRuntimeAvailable();
    if (!native) {
      // Optionally refine the prompt offline with a text model — does not fabricate pixels.
      let refined = prompt;
      try {
        const chatModels = modelRegistry.listByCapability('chat', true);
        if (chatModels[0]) {
          const polish = await aiService.generateText({
            modelId: chatModels[0].id,
            systemPrompt:
              'Refine the image prompt for diffusion models. Return ONLY the improved prompt text.',
            prompt: `Prompt: ${prompt}\nNegative: ${request.negativePrompt ?? ''}`,
            maxTokens: 120,
            temperature: 0.4,
            signal: request.signal,
          });
          if (polish.text.trim()) refined = polish.text.trim();
        }
      } catch {
        // Keep original prompt
      }

      const job = this.buildJob({ ...request, prompt: refined }, refined);
      const output = new File(getImageGenDir(), `${job.id}.pending.json`);
      if (!output.exists) output.create({ intermediates: true });
      output.write(
        JSON.stringify(
          {
            ...job,
            modelId: model.id,
            createdAt: Date.now(),
            note: 'Awaiting native diffusion runtime (pocketbrain-diffusion). No placeholder image was created.',
          },
          null,
          2,
        ),
      );

      return {
        status: 'requires_runtime',
        message:
          'Image model is installed, but the native on-device diffusion runtime is not linked yet. Use a custom dev client with the diffusion module to generate pixels. A job file was saved locally — no fake image was produced.',
        outputPath: output.uri,
        modelId: model.id,
        job,
      };
    }

    // When native module exists, call it here and write a real PNG/JPEG.
    throw new Error('Native diffusion runtime bridge is present but not wired in this build.');
  }

  private buildJob(request: ImageGenRequest, prompt: string) {
    return {
      id: createId(),
      prompt,
      negativePrompt: request.negativePrompt,
      mode: request.mode,
      width: request.width ?? 512,
      height: request.height ?? 512,
      seed: request.seed ?? Math.floor(Math.random() * 1_000_000),
      initImageUri: request.initImageUri,
    };
  }
}

export const imageGenerationService = new ImageGenerationService();
