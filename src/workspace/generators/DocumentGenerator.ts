import { aiService } from '../../services/AIService';
import { createId } from '../../utils/format';
import type {
  ContentBlock,
  DocumentBody,
  WorkspaceDocType,
  WorkspaceDocument,
} from '../types/document';
import {
  createBlock,
  parseLooseJson,
  spansFromPlain,
} from '../utils/blocks';
import { getTemplateById } from '../templates/catalog';
import { resolveInstalledOrStarterModelId } from '../utils/resolveModelId';

interface GenerateOptions {
  prompt: string;
  type?: WorkspaceDocType;
  templateId?: string;
  modelId?: string;
  title?: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

interface AiDocumentPayload {
  title?: string;
  blocks?: Array<{
    type: ContentBlock['type'];
    text?: string;
    checked?: boolean;
    language?: string;
    rows?: string[][];
  }>;
}

function blocksFromPlainAiText(text: string): ContentBlock[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [createBlock('paragraph', 'Generated document.')];
  }

  return lines.map((line) => {
    if (/^#\s+/.test(line)) return createBlock('heading1', line.replace(/^#\s+/, ''));
    if (/^##\s+/.test(line)) return createBlock('heading2', line.replace(/^##\s+/, ''));
    if (/^###\s+/.test(line)) return createBlock('heading3', line.replace(/^###\s+/, ''));
    if (/^[-*]\s+\[ \]\s+/.test(line)) {
      return createBlock('checkbox', line.replace(/^[-*]\s+\[ \]\s+/, ''), { checked: false });
    }
    if (/^[-*]\s+\[x\]\s+/i.test(line)) {
      return createBlock('checkbox', line.replace(/^[-*]\s+\[x\]\s+/i, ''), { checked: true });
    }
    if (/^[-*]\s+/.test(line)) return createBlock('bullet', line.replace(/^[-*]\s+/, ''));
    if (/^\d+\.\s+/.test(line)) return createBlock('numbered', line.replace(/^\d+\.\s+/, ''));
    if (/^>\s+/.test(line)) return createBlock('quote', line.replace(/^>\s+/, ''));
    return createBlock('paragraph', line);
  });
}

function bodyFromAiPayload(payload: AiDocumentPayload, fallbackText: string): DocumentBody {
  if (payload.blocks?.length) {
    const blocks: ContentBlock[] = payload.blocks.map((b) => {
      if (b.type === 'table' && b.rows) {
        return {
          id: createId(),
          type: 'table',
          rows: b.rows.map((row) => row.map((cell) => ({ spans: spansFromPlain(cell) }))),
        };
      }
      return createBlock(b.type || 'paragraph', b.text ?? '', {
        checked: b.checked,
        language: b.language,
      });
    });
    return { blocks };
  }
  return { blocks: blocksFromPlainAiText(fallbackText) };
}

export class DocumentGenerator {
  async generate(options: GenerateOptions): Promise<{
    title: string;
    type: WorkspaceDocType;
    body: DocumentBody;
    modelId: string;
  }> {
    const template = options.templateId ? getTemplateById(options.templateId) : undefined;
    const type = options.type ?? template?.type ?? 'document';
    const modelId = resolveInstalledOrStarterModelId(options.modelId);

    const systemPrompt = `You are PocketBrain Workspace, an offline document generator.
Return ONLY valid JSON with this shape:
{"title":"string","blocks":[{"type":"heading1|heading2|heading3|paragraph|bullet|numbered|checkbox|code|quote","text":"string","checked":false}]}
Create a complete, useful ${type} for the user request. No markdown fences. No prose outside JSON.`;

    const prompt = [
      template ? `Template: ${template.name}. ${template.promptHint}` : null,
      `User request: ${options.prompt}`,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await aiService.generateText({
      modelId,
      systemPrompt,
      prompt,
      maxTokens: 1200,
      temperature: 0.4,
      signal: options.signal,
      onToken: options.onToken
        ? ({ token, done }) => {
            if (!done) options.onToken?.(token);
          }
        : undefined,
    });

    const parsed = parseLooseJson<AiDocumentPayload>(result.text);
    let body: DocumentBody;
    let title = options.title?.trim() || '';

    if (parsed) {
      body = bodyFromAiPayload(parsed, result.text);
      title = title || parsed.title || deriveTitle(options.prompt, type);
    } else if (template) {
      body = {
        ...structuredClone(template.body),
        blocks: [
          ...structuredClone(template.body.blocks),
          createBlock('heading2', 'AI Draft'),
          ...blocksFromPlainAiText(result.text),
        ],
      };
      title = title || template.name;
    } else {
      body = { blocks: blocksFromPlainAiText(result.text) };
      title = title || deriveTitle(options.prompt, type);
    }

    return { title, type, body, modelId };
  }
}

function deriveTitle(prompt: string, type: WorkspaceDocType): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return `Untitled ${type}`;
  return cleaned.slice(0, 60);
}

export const documentGenerator = new DocumentGenerator();
