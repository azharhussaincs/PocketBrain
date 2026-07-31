import { resolveInstalledOrStarterModelId } from '../utils/resolveModelId';
import { aiService } from '../../services/AIService';
import type { AIEditAction } from '../types/document';

const ACTION_INSTRUCTIONS: Record<AIEditAction, string> = {
  rewrite: 'Rewrite the text clearly while preserving meaning.',
  summarize: 'Summarize the text in fewer words. Keep key facts.',
  expand: 'Expand the text with useful detail and examples.',
  shorten: 'Shorten the text aggressively while preserving meaning.',
  grammar: 'Correct grammar, spelling, and punctuation. Keep the voice.',
  tone_professional: 'Rewrite in a professional business tone.',
  tone_friendly: 'Rewrite in a friendly, approachable tone.',
  tone_academic: 'Rewrite in an academic tone with precise language.',
  translate: 'Translate the text to clear English unless another language is specified in the text.',
  bullets: 'Convert the text into concise bullet points (plain lines, one point per line).',
  readability: 'Improve readability: shorter sentences, simpler words, clearer structure.',
  continue: 'Continue writing from the end of the text in the same style.',
};

export class AIEditService {
  async edit(options: {
    action: AIEditAction;
    text: string;
    modelId?: string;
    targetLanguage?: string;
    signal?: AbortSignal;
    onToken?: (token: string) => void;
  }): Promise<string> {
    const source = options.text.trim();
    if (!source) return '';

    const instruction =
      options.action === 'translate' && options.targetLanguage
        ? `Translate the text to ${options.targetLanguage}.`
        : ACTION_INSTRUCTIONS[options.action];

    const result = await aiService.generateText({
      modelId: resolveInstalledOrStarterModelId(options.modelId),
      systemPrompt: `You are PocketBrain writing assistant running fully offline.
${instruction}
Return ONLY the edited text. No preface. No quotes.`,
      prompt: source,
      maxTokens: 900,
      temperature: 0.35,
      signal: options.signal,
      onToken: options.onToken
        ? ({ token, done }) => {
            if (!done) options.onToken?.(token);
          }
        : undefined,
    });

    return result.text.trim() || source;
  }
}

export const aiEditService = new AIEditService();
