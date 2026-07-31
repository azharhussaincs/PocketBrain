import { aiService } from '../../services/AIService';
import type { DocumentBody, SlideContent } from '../types/document';
import { createBlock, ensureSlide, parseLooseJson } from '../utils/blocks';
import { resolveInstalledOrStarterModelId } from '../utils/resolveModelId';

interface GenerateOptions {
  prompt: string;
  modelId?: string;
  title?: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

interface AiDeckPayload {
  title?: string;
  slides?: Array<{
    title: string;
    bullets?: string[];
    notes?: string;
    chart?: {
      title: string;
      kind?: 'bar' | 'line' | 'pie';
      labels: string[];
      values: number[];
    };
  }>;
}

function slidesFromText(text: string, title: string): SlideContent[] {
  const chunks = text
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!chunks.length) {
    return [
      ensureSlide({
        title,
        bullets: ['Overview', 'Key points', 'Next steps'],
        notes: 'Generated offline',
      }),
    ];
  }

  return chunks.map((chunk, index) => {
    const lines = chunk.split('\n').map((l) => l.replace(/^[-*#\d.\s]+/, '').trim()).filter(Boolean);
    return ensureSlide({
      title: lines[0] || `Slide ${index + 1}`,
      bullets: lines.slice(1, 6),
      notes: '',
    });
  });
}

export class PresentationGenerator {
  async generate(options: GenerateOptions): Promise<{
    title: string;
    body: DocumentBody;
    modelId: string;
  }> {
    const modelId = resolveInstalledOrStarterModelId(options.modelId);
    const systemPrompt = `You are PocketBrain Presentation Generator.
Return ONLY JSON:
{"title":"string","slides":[{"title":"string","bullets":["string"],"notes":"string","chart":{"title":"string","kind":"bar","labels":["A"],"values":[1]}}]}
Create 4-8 professional slides. Charts are optional. No markdown fences.`;

    const result = await aiService.generateText({
      modelId,
      systemPrompt,
      prompt: options.prompt,
      maxTokens: 1400,
      temperature: 0.45,
      signal: options.signal,
      onToken: options.onToken
        ? ({ token, done }) => {
            if (!done) options.onToken?.(token);
          }
        : undefined,
    });

    const parsed = parseLooseJson<AiDeckPayload>(result.text);
    const title =
      options.title?.trim() ||
      parsed?.title ||
      options.prompt.replace(/\s+/g, ' ').trim().slice(0, 60) ||
      'Presentation';

    const slides: SlideContent[] = parsed?.slides?.length
      ? parsed.slides.map((s) =>
          ensureSlide({
            title: s.title,
            bullets: s.bullets ?? [],
            notes: s.notes,
            chart: s.chart
              ? {
                  title: s.chart.title,
                  kind: s.chart.kind ?? 'bar',
                  labels: s.chart.labels,
                  values: s.chart.values,
                }
              : undefined,
          }),
        )
      : slidesFromText(result.text, title);

    return {
      title,
      modelId,
      body: {
        blocks: [createBlock('heading1', title)],
        slides,
      },
    };
  }
}

export const presentationGenerator = new PresentationGenerator();
