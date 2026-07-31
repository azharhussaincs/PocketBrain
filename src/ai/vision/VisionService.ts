import { File } from 'expo-file-system';
import { aiService } from '../../services/AIService';
import { modelRegistry } from '../registry/ModelRegistry';

export type VisionTask =
  | 'describe'
  | 'caption'
  | 'objects'
  | 'vqa'
  | 'screenshot'
  | 'document';

export interface VisionRequest {
  imageUri: string;
  task: VisionTask;
  question?: string;
  modelId?: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

/**
 * Limited image-understanding helper.
 *
 * Honest capability (current build):
 * - Requires an installed model tagged with the `vision` capability.
 * - Does **not** load image pixels into llama.rn (no mmproj multimodal path yet).
 * - Sends task text + image URI to a text completion runtime and labels the result.
 *
 * Does not invent captions when no vision-capable model is installed.
 */
export const VISION_LIMITATION_NOTICE =
  '[Limited Vision] This PocketBrain build does not pass image pixels into the GGUF runtime. Answers below are text-only commentary and must not be treated as verified image understanding. Full on-device vision requires a future multimodal adapter.';

export class VisionService {
  listVisionModels(installedOnly = true) {
    return modelRegistry.listByCapability('vision', installedOnly);
  }

  hasVisionModel(): boolean {
    return this.listVisionModels(true).length > 0;
  }

  async analyze(request: VisionRequest): Promise<{ text: string; modelId: string }> {
    const models = this.listVisionModels(true);
    const model = request.modelId
      ? models.find((m) => m.id === request.modelId)
      : models[0];

    if (!model) {
      throw new Error(
        'No vision-tagged model is installed. Download a vision-tagged GGUF from Marketplace (e.g. SmolVLM). Note: this build still cannot load image pixels — results remain limited.',
      );
    }

    if (request.imageUri.startsWith('file://') || request.imageUri.startsWith('/')) {
      try {
        const file = new File(request.imageUri);
        if (!file.exists) {
          throw new Error('Image file not found on device.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) throw error;
      }
    }

    const prompt = buildVisionPrompt(request);
    const result = await aiService.generateText({
      modelId: model.id,
      systemPrompt:
        'You are PocketBrain Limited Vision. You cannot see image pixels in this build. Do not invent objects, text, or people from the URI alone. State that visual content is unverified. Offer only cautious, clearly speculative commentary if asked.',
      prompt: `${prompt}\n\nImage URI (path only — pixels not loaded): ${request.imageUri}`,
      maxTokens: 512,
      temperature: 0.2,
      signal: request.signal,
      onToken: request.onToken
        ? ({ token, done }) => {
            if (!done) request.onToken?.(token);
          }
        : undefined,
    });

    const body = result.text.trim();
    return {
      text: body.startsWith('[Limited Vision]')
        ? body
        : `${VISION_LIMITATION_NOTICE}\n\n${body}`,
      modelId: model.id,
    };
  }
}

function buildVisionPrompt(request: VisionRequest): string {
  switch (request.task) {
    case 'caption':
      return 'The user asked for a caption. Remind them pixels are not loaded; refuse to invent a confident caption.';
    case 'objects':
      return 'The user asked for objects in the image. Remind them pixels are not loaded; do not invent an object list.';
    case 'vqa':
      return `The user asked: ${request.question ?? 'What is shown?'}. Remind them pixels are not loaded; do not invent a visual answer.`;
    case 'screenshot':
      return 'The user asked about a screenshot. Remind them pixels are not loaded; do not invent UI contents.';
    case 'document':
      return 'The user asked to summarize a document image. Remind them pixels are not loaded; suggest on-device OCR instead.';
    case 'describe':
    default:
      return 'The user asked for an image description. Remind them pixels are not loaded; do not invent visual details.';
  }
}

export const visionService = new VisionService();
