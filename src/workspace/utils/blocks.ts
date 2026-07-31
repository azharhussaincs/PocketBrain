import { createId } from '../../utils/format';
import type {
  ContentBlock,
  DocumentBody,
  SlideContent,
  SpreadsheetData,
  TextSpan,
  WorkspaceDocType,
} from '../types/document';

export function span(text: string, marks?: TextSpan['marks']): TextSpan {
  return marks?.length ? { text, marks } : { text };
}

export function plainFromSpans(spans: TextSpan[] = []): string {
  return spans.map((s) => s.text).join('');
}

export function spansFromPlain(text: string, marks?: TextSpan['marks']): TextSpan[] {
  return [span(text, marks)];
}

export function createBlock(
  type: ContentBlock['type'],
  text = '',
  extra: Partial<ContentBlock> = {},
): ContentBlock {
  return {
    id: createId(),
    type,
    spans: spansFromPlain(text),
    ...extra,
  };
}

export function emptyBody(type: WorkspaceDocType): DocumentBody {
  switch (type) {
    case 'presentation':
      return {
        blocks: [createBlock('heading1', 'Untitled Presentation')],
        slides: [
          {
            id: createId(),
            title: 'Title Slide',
            bullets: ['Add your key points'],
            notes: '',
          },
        ],
      };
    case 'spreadsheet':
    case 'csv':
      return {
        blocks: [createBlock('heading1', 'Untitled Spreadsheet')],
        spreadsheet: {
          sheetName: 'Sheet1',
          columns: ['A', 'B', 'C'],
          rows: [
            [{ value: '' }, { value: '' }, { value: '' }],
            [{ value: '' }, { value: '' }, { value: '' }],
          ],
        },
      };
    case 'mermaid':
      return {
        blocks: [createBlock('heading1', 'Diagram')],
        mermaidSource: 'flowchart TD\n  A[Start] --> B[End]',
      };
    case 'svg':
      return {
        blocks: [createBlock('heading1', 'SVG Drawing')],
        svgMarkup:
          '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#CCFBF1"/><text x="160" y="96" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#0F766E">PocketBrain</text></svg>',
      };
    case 'json':
      return {
        blocks: [
          createBlock('code', '{\n  "title": "Untitled",\n  "items": []\n}', {
            language: 'json',
          }),
        ],
      };
    case 'code':
      return {
        blocks: [createBlock('code', '// Untitled\n', { language: 'typescript' })],
        codeLanguage: 'typescript',
      };
    case 'html':
      return {
        blocks: [createBlock('heading1', 'HTML Document')],
        htmlBody:
          '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Untitled</title></head><body><h1>Untitled</h1><p>Start writing…</p></body></html>',
      };
    default:
      return {
        blocks: [
          createBlock('heading1', 'Untitled'),
          createBlock('paragraph', 'Start writing…'),
        ],
      };
  }
}

export function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'divider') return '---';
      if (block.type === 'table' && block.rows) {
        return block.rows
          .map((row) => row.map((cell) => plainFromSpans(cell.spans)).join('\t'))
          .join('\n');
      }
      if (block.type === 'checkbox') {
        return `${block.checked ? '[x]' : '[ ]'} ${plainFromSpans(block.spans)}`;
      }
      return plainFromSpans(block.spans);
    })
    .join('\n');
}

export function documentPlainText(body: DocumentBody): string {
  const parts = [blocksToPlainText(body.blocks)];
  if (body.slides?.length) {
    parts.push(
      body.slides
        .map(
          (s) =>
            `${s.title}\n${s.bullets.map((b) => `• ${b}`).join('\n')}${s.notes ? `\nNotes: ${s.notes}` : ''}`,
        )
        .join('\n\n'),
    );
  }
  if (body.spreadsheet) {
    parts.push(spreadsheetToCsv(body.spreadsheet));
  }
  if (body.mermaidSource) parts.push(body.mermaidSource);
  if (body.svgMarkup) parts.push(body.svgMarkup);
  if (body.htmlBody) parts.push(body.htmlBody);
  return parts.filter(Boolean).join('\n\n');
}

export function spreadsheetToCsv(sheet: SpreadsheetData): string {
  const lines = [sheet.columns.join(',')];
  for (const row of sheet.rows) {
    lines.push(
      row
        .map((cell) => {
          const raw = cell.value == null ? '' : String(cell.value);
          if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
          return raw;
        })
        .join(','),
    );
  }
  return lines.join('\n');
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function findReplaceInBody(
  body: DocumentBody,
  find: string,
  replace: string,
  all: boolean,
): DocumentBody {
  if (!find) return body;
  let remaining = all ? Number.POSITIVE_INFINITY : 1;

  const replaceText = (input: string): string => {
    if (remaining <= 0) return input;
    if (all) {
      const parts = input.split(find);
      remaining -= parts.length - 1;
      return parts.join(replace);
    }
    const idx = input.indexOf(find);
    if (idx < 0) return input;
    remaining -= 1;
    return input.slice(0, idx) + replace + input.slice(idx + find.length);
  };

  const nextBlocks = body.blocks.map((block) => ({
    ...block,
    spans: block.spans?.map((s) => ({ ...s, text: replaceText(s.text) })),
    rows: block.rows?.map((row) =>
      row.map((cell) => ({
        spans: cell.spans.map((s) => ({ ...s, text: replaceText(s.text) })),
      })),
    ),
    raw: block.raw != null ? replaceText(block.raw) : block.raw,
  }));

  const nextSlides = body.slides?.map((slide) => ({
    ...slide,
    title: replaceText(slide.title),
    bullets: slide.bullets.map(replaceText),
    notes: slide.notes != null ? replaceText(slide.notes) : slide.notes,
  }));

  return {
    ...body,
    blocks: nextBlocks,
    slides: nextSlides,
    mermaidSource: body.mermaidSource != null ? replaceText(body.mermaidSource) : undefined,
    svgMarkup: body.svgMarkup != null ? replaceText(body.svgMarkup) : undefined,
    htmlBody: body.htmlBody != null ? replaceText(body.htmlBody) : undefined,
  };
}

export function applyMarksToSelection(
  spans: TextSpan[],
  selectedText: string,
  mark: NonNullable<TextSpan['marks']>[number],
  enable: boolean,
): TextSpan[] {
  if (!selectedText) return spans;
  const plain = plainFromSpans(spans);
  const start = plain.indexOf(selectedText);
  if (start < 0) return spans;

  // Rebuild as three spans for simplicity and correctness on mobile.
  const before = plain.slice(0, start);
  const mid = plain.slice(start, start + selectedText.length);
  const after = plain.slice(start + selectedText.length);
  const midMarks = new Set<NonNullable<TextSpan['marks']>[number]>(
    spans.flatMap((s) => s.marks ?? []),
  );
  if (enable) midMarks.add(mark);
  else midMarks.delete(mark);

  return [
    ...(before ? [span(before)] : []),
    span(mid, Array.from(midMarks)),
    ...(after ? [span(after)] : []),
  ];
}

export function ensureSlide(slide?: Partial<SlideContent>): SlideContent {
  return {
    id: slide?.id ?? createId(),
    title: slide?.title ?? 'Slide',
    bullets: slide?.bullets ?? [],
    notes: slide?.notes ?? '',
    chart: slide?.chart,
  };
}

export function parseLooseJson<T>(text: string): T | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
