import { aiService } from '../../services/AIService';
import type { DocumentBody, SpreadsheetData } from '../types/document';
import { createBlock, parseLooseJson } from '../utils/blocks';
import { resolveInstalledOrStarterModelId } from '../utils/resolveModelId';

interface GenerateOptions {
  prompt: string;
  modelId?: string;
  title?: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

interface AiSheetPayload {
  title?: string;
  sheetName?: string;
  columns?: string[];
  rows?: Array<Array<string | number | null>>;
}

function defaultSheet(prompt: string): SpreadsheetData {
  return {
    sheetName: 'Sheet1',
    columns: ['Item', 'Quantity', 'Unit Cost', 'Total'],
    rows: [
      [{ value: prompt.slice(0, 40) || 'Item A' }, { value: 1 }, { value: 100 }, { value: 100 }],
      [{ value: 'Item B' }, { value: 2 }, { value: 50 }, { value: 100 }],
      [{ value: 'Subtotal' }, { value: '' }, { value: '' }, { value: 200 }],
    ],
  };
}

export class SpreadsheetGenerator {
  async generate(options: GenerateOptions): Promise<{
    title: string;
    body: DocumentBody;
    modelId: string;
  }> {
    const modelId = resolveInstalledOrStarterModelId(options.modelId);
    const systemPrompt = `You are PocketBrain Spreadsheet Generator.
Return ONLY JSON:
{"title":"string","sheetName":"Sheet1","columns":["A","B"],"rows":[["x",1],["y",2]]}
Create useful tabular data with calculations already computed as values. No formulas required. No markdown fences.`;

    const result = await aiService.generateText({
      modelId,
      systemPrompt,
      prompt: options.prompt,
      maxTokens: 1200,
      temperature: 0.3,
      signal: options.signal,
      onToken: options.onToken
        ? ({ token, done }) => {
            if (!done) options.onToken?.(token);
          }
        : undefined,
    });

    const parsed = parseLooseJson<AiSheetPayload>(result.text);
    const title =
      options.title?.trim() ||
      parsed?.title ||
      options.prompt.replace(/\s+/g, ' ').trim().slice(0, 60) ||
      'Spreadsheet';

    const spreadsheet: SpreadsheetData =
      parsed?.columns?.length && parsed.rows
        ? {
            sheetName: parsed.sheetName || 'Sheet1',
            columns: parsed.columns,
            rows: parsed.rows.map((row) =>
              row.map((value) => ({ value: value as string | number | null })),
            ),
          }
        : defaultSheet(options.prompt);

    return {
      title,
      modelId,
      body: {
        blocks: [createBlock('heading1', title)],
        spreadsheet,
      },
    };
  }
}

export const spreadsheetGenerator = new SpreadsheetGenerator();
