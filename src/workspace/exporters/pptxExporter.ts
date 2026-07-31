import PptxGenJS from 'pptxgenjs';
import type { WorkspaceDocument } from '../types/document';
import { ensureSlide } from '../utils/blocks';

export async function exportPptxBase64(doc: WorkspaceDocument): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.author = 'PocketBrain';
  pptx.title = doc.title;
  pptx.subject = 'Generated offline on device';

  const slides =
    doc.body.slides && doc.body.slides.length > 0
      ? doc.body.slides
      : [
          ensureSlide({
            title: doc.title,
            bullets: doc.body.blocks
              .filter(
                (b) =>
                  b.type === 'bullet' ||
                  b.type === 'paragraph' ||
                  b.type.startsWith('heading'),
              )
              .map((b) => (b.spans ?? []).map((s) => s.text).join(''))
              .filter(Boolean)
              .slice(0, 6),
          }),
        ];

  slides.forEach((slide, index) => {
    const s = pptx.addSlide();
    s.addText(slide.title || `Slide ${index + 1}`, {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: '0F766E',
    });

    if (slide.bullets.length) {
      s.addText(
        slide.bullets.map((b) => ({
          text: b,
          options: { bullet: true, breakLine: true },
        })),
        {
          x: 0.7,
          y: 1.4,
          w: 8.6,
          h: 3.6,
          fontSize: 18,
          color: '0F172A',
          valign: 'top',
        },
      );
    }

    if (slide.chart) {
      s.addChart(
        pptx.ChartType.bar,
        [
          {
            name: slide.chart.title,
            labels: slide.chart.labels,
            values: slide.chart.values,
          },
        ],
        {
          x: 5.2,
          y: 1.5,
          w: 4.3,
          h: 3.2,
          showTitle: true,
          title: slide.chart.title,
        },
      );
    }

    if (slide.notes) {
      s.addNotes(slide.notes);
    }
  });

  const output = await pptx.write({ outputType: 'base64' });
  return typeof output === 'string' ? output : String(output);
}
