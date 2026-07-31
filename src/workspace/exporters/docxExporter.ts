import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  BorderStyle,
  WidthType,
} from 'docx';
import type { ContentBlock, TextSpan, WorkspaceDocument } from '../types/document';
import { plainFromSpans } from '../utils/blocks';

function runsFromSpans(spans: TextSpan[] = []): TextRun[] {
  if (!spans.length) return [new TextRun('')];
  return spans.map(
    (s) =>
      new TextRun({
        text: s.text,
        bold: s.marks?.includes('bold'),
        italics: s.marks?.includes('italic'),
        underline: s.marks?.includes('underline') ? {} : undefined,
        highlight: s.marks?.includes('highlight') ? 'yellow' : undefined,
        font: s.marks?.includes('code') ? 'Courier New' : undefined,
      }),
  );
}

function paragraphFromBlock(block: ContentBlock): Paragraph | Table {
  const text = plainFromSpans(block.spans);
  switch (block.type) {
    case 'heading1':
      return new Paragraph({
        children: runsFromSpans(block.spans),
        heading: HeadingLevel.HEADING_1,
      });
    case 'heading2':
      return new Paragraph({
        children: runsFromSpans(block.spans),
        heading: HeadingLevel.HEADING_2,
      });
    case 'heading3':
      return new Paragraph({
        children: runsFromSpans(block.spans),
        heading: HeadingLevel.HEADING_3,
      });
    case 'bullet':
      return new Paragraph({
        children: runsFromSpans(block.spans),
        bullet: { level: 0 },
      });
    case 'numbered':
      return new Paragraph({
        children: runsFromSpans(block.spans),
        numbering: { reference: 'workspace-numbers', level: 0 },
      });
    case 'checkbox':
      return new Paragraph({
        children: [
          new TextRun(`${block.checked ? '☑' : '☐'} `),
          ...runsFromSpans(block.spans),
        ],
      });
    case 'code':
      return new Paragraph({
        children: [
          new TextRun({
            text: text || block.raw || '',
            font: 'Courier New',
          }),
        ],
      });
    case 'quote':
      return new Paragraph({
        children: runsFromSpans(block.spans),
        indent: { left: 420 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: '0F766E', space: 8 },
        },
      });
    case 'divider':
      return new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 8 },
        },
        children: [],
      });
    case 'table': {
      const rows = block.rows ?? [];
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({ children: runsFromSpans(cell.spans) }),
                    ],
                  }),
              ),
            }),
        ),
      });
    }
    default:
      return new Paragraph({
        children: runsFromSpans(block.spans),
        alignment: AlignmentType.LEFT,
      });
  }
}

export async function exportDocxBase64(doc: WorkspaceDocument): Promise<string> {
  const children = doc.body.blocks.map(paragraphFromBlock);

  const document = new Document({
    numbering: {
      config: [
        {
          reference: 'workspace-numbers',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: doc.title, bold: true, size: 32 })],
          }),
          new Paragraph({ children: [] }),
          ...children,
        ],
      },
    ],
  });

  return Packer.toBase64String(document);
}
