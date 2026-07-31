import { documentGenerator } from './DocumentGenerator';
import type { DocumentBody } from '../types/document';
import { createId } from '../../utils/format';
import { createBlock, spansFromPlain } from '../utils/blocks';

/**
 * Builds print-oriented document bodies for PDF export
 * (headers/footers/page numbers are applied by the PDF exporter).
 */
export class PDFGenerator {
  async generate(options: {
    prompt: string;
    modelId?: string;
    title?: string;
    onToken?: (token: string) => void;
    signal?: AbortSignal;
  }): Promise<{ title: string; body: DocumentBody; modelId: string }> {
    const base = await documentGenerator.generate({
      ...options,
      type: 'pdf',
    });

    const hasTable = base.body.blocks.some((b) => b.type === 'table');
    const blocks = [...base.body.blocks];

    if (!hasTable) {
      blocks.push({
        id: createId(),
        type: 'table',
        rows: [
          [
            { spans: spansFromPlain('Section') },
            { spans: spansFromPlain('Detail') },
          ],
          [
            { spans: spansFromPlain('Prepared') },
            { spans: spansFromPlain(new Date().toLocaleDateString()) },
          ],
          [
            { spans: spansFromPlain('Status') },
            { spans: spansFromPlain('Draft · Offline') },
          ],
        ],
      });
    }

    blocks.push(createBlock('divider'));
    blocks.push(
      createBlock(
        'paragraph',
        'Generated locally by PocketBrain. Headers, footers, and page numbers are applied on PDF export.',
      ),
    );

    return {
      title: base.title,
      modelId: base.modelId,
      body: { ...base.body, blocks },
    };
  }
}

export const pdfGenerator = new PDFGenerator();
