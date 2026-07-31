import type {
  InferenceRequest,
  InferenceResult,
  InferenceToken,
  RuntimeAdapter,
} from '../../types/inference';

/**
 * Offline mock runtime used when llama.rn is unavailable (Expo Go / CI).
 * For Workspace prompts it returns real structured JSON that generators parse
 * into exportable documents — not placeholder UI strings.
 */
export class MockRuntimeAdapter implements RuntimeAdapter {
  id = 'mock' as const;
  displayName = 'Mock Runtime (development)';
  private loadedPath: string | null = null;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async loadModel(path: string): Promise<void> {
    this.loadedPath = path;
  }

  async unloadModel(): Promise<void> {
    this.loadedPath = null;
  }

  isModelLoaded(): boolean {
    return this.loadedPath != null;
  }

  async complete(
    request: InferenceRequest,
    onToken?: (token: InferenceToken) => void,
    signal?: AbortSignal,
  ): Promise<InferenceResult> {
    const started = Date.now();
    const system = request.systemPrompt ?? '';
    const prompt = request.prompt.trim();

    let reply: string;
    if (/Presentation Generator/i.test(system)) {
      reply = buildPresentationJson(prompt);
    } else if (/Spreadsheet Generator/i.test(system)) {
      reply = buildSpreadsheetJson(prompt);
    } else if (/document generator|Workspace/i.test(system) && /JSON/i.test(system)) {
      reply = buildDocumentJson(prompt);
    } else if (/writing assistant/i.test(system)) {
      reply = editTextLocally(system, prompt);
    } else {
      reply =
        `PocketBrain local response for "${prompt}". ` +
        `Install llama.rn via a custom Expo dev client for neural inference. ` +
        `No cloud APIs are used.`;
    }

    const words = reply.split(/(\s+)/);
    let text = '';
    let cancelled = false;

    for (const word of words) {
      if (signal?.aborted) {
        cancelled = true;
        break;
      }
      text += word;
      onToken?.({ token: word, done: false });
      await sleep(8);
    }

    onToken?.({ token: '', done: true });
    return {
      text,
      tokensGenerated: words.filter((w) => w.trim()).length,
      durationMs: Date.now() - started,
      cancelled,
    };
  }
}

function buildDocumentJson(prompt: string): string {
  const title = titleFrom(prompt, 'Document');
  return JSON.stringify({
    title,
    blocks: [
      { type: 'heading1', text: title },
      {
        type: 'paragraph',
        text: `This document was generated offline in response to: ${prompt}`,
      },
      { type: 'heading2', text: 'Overview' },
      {
        type: 'paragraph',
        text: 'PocketBrain creates structured documents on-device. Replace the mock runtime with llama.rn for neural generation while keeping the same export pipeline.',
      },
      { type: 'heading2', text: 'Key Sections' },
      { type: 'bullet', text: 'Goals and scope' },
      { type: 'bullet', text: 'Approach and deliverables' },
      { type: 'bullet', text: 'Timeline and next steps' },
      { type: 'heading2', text: 'Action Items' },
      { type: 'checkbox', text: 'Review draft', checked: false },
      { type: 'checkbox', text: 'Export to DOCX or PDF', checked: false },
      { type: 'heading2', text: 'Details' },
      {
        type: 'paragraph',
        text: 'All content remains on this device. Exports use production libraries (docx, pdf-lib, pptxgenjs, SheetJS).',
      },
    ],
  });
}

function buildPresentationJson(prompt: string): string {
  const title = titleFrom(prompt, 'Presentation');
  return JSON.stringify({
    title,
    slides: [
      {
        title,
        bullets: ['Offline AI Workspace', 'Local models', 'Professional exports'],
        notes: 'Open with the product vision.',
      },
      {
        title: 'Problem',
        bullets: ['Cloud dependency', 'Privacy concerns', 'Fragmented AI tools'],
        notes: 'Emphasize ownership of models and documents.',
      },
      {
        title: 'Solution',
        bullets: [prompt.slice(0, 80) || 'PocketBrain OS', 'On-device inference', 'Office-class workspace'],
      },
      {
        title: 'Traction Signals',
        bullets: ['Marketplace', 'Chat', 'Workspace'],
        chart: {
          title: 'Module readiness',
          kind: 'bar',
          labels: ['Core', 'Chat', 'Workspace'],
          values: [100, 100, 90],
        },
        notes: 'Chart is embedded in PPTX export.',
      },
      {
        title: 'Ask / Next Steps',
        bullets: ['Install models', 'Create documents', 'Export DOCX/PDF/PPTX/XLSX'],
      },
    ],
  });
}

function buildSpreadsheetJson(prompt: string): string {
  const title = titleFrom(prompt, 'Spreadsheet');
  return JSON.stringify({
    title,
    sheetName: 'Data',
    columns: ['Item', 'Qty', 'Unit', 'Total'],
    rows: [
      [prompt.slice(0, 28) || 'Primary line', 1, 250, 250],
      ['Secondary line', 3, 80, 240],
      ['Support', 2, 45, 90],
      ['Total', '', '', 580],
    ],
  });
}

function editTextLocally(system: string, text: string): string {
  if (/Summarize/i.test(system)) {
    const words = text.split(/\s+/);
    return words.slice(0, Math.max(12, Math.floor(words.length / 3))).join(' ') + '…';
  }
  if (/Shorten/i.test(system)) {
    return text.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  }
  if (/bullet/i.test(system)) {
    return text
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .map((s) => s.replace(/^/, '').trim())
      .join('\n');
  }
  if (/professional/i.test(system)) {
    return text.replace(/\bcan't\b/gi, 'cannot').replace(/\bwon't\b/gi, 'will not');
  }
  if (/friendly/i.test(system)) {
    return `${text}${/[.!?]$/.test(text) ? '' : '.'} Happy to refine this further.`;
  }
  if (/academic/i.test(system)) {
    return `This passage discusses the following: ${text}`;
  }
  if (/Continue/i.test(system)) {
    return `${text} Additionally, the next steps should be documented and reviewed offline before export.`;
  }
  if (/Expand/i.test(system)) {
    return `${text}\n\nFurther detail: clarify stakeholders, constraints, success metrics, and verification steps before finalizing.`;
  }
  if (/grammar|Correct/i.test(system) || /readability/i.test(system) || /Rewrite/i.test(system)) {
    return text.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
  }
  if (/Translate/i.test(system)) {
    return text;
  }
  return text;
}

function titleFrom(prompt: string, fallback: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, 48);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
