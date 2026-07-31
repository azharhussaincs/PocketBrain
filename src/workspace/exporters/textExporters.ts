import type { ContentBlock, WorkspaceDocument } from '../types/document';
import { documentPlainText, plainFromSpans } from '../utils/blocks';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function spansToHtml(block: ContentBlock): string {
  return (block.spans ?? [])
    .map((s) => {
      let html = escapeHtml(s.text);
      if (s.marks?.includes('code')) html = `<code>${html}</code>`;
      if (s.marks?.includes('bold')) html = `<strong>${html}</strong>`;
      if (s.marks?.includes('italic')) html = `<em>${html}</em>`;
      if (s.marks?.includes('underline')) html = `<u>${html}</u>`;
      if (s.marks?.includes('highlight')) {
        html = `<mark>${html}</mark>`;
      }
      if (s.link) html = `<a href="${escapeHtml(s.link)}">${html}</a>`;
      return html;
    })
    .join('');
}

function blockToMarkdown(block: ContentBlock): string {
  const text = plainFromSpans(block.spans);
  switch (block.type) {
    case 'heading1':
      return `# ${text}`;
    case 'heading2':
      return `## ${text}`;
    case 'heading3':
      return `### ${text}`;
    case 'bullet':
      return `- ${text}`;
    case 'numbered':
      return `1. ${text}`;
    case 'checkbox':
      return `- [${block.checked ? 'x' : ' '}] ${text}`;
    case 'code':
      return `\`\`\`${block.language ?? ''}\n${text || block.raw || ''}\n\`\`\``;
    case 'quote':
      return `> ${text}`;
    case 'divider':
      return '---';
    case 'table':
      if (!block.rows?.length) return '';
      {
        const lines = block.rows.map((row) =>
          `| ${row.map((c) => plainFromSpans(c.spans)).join(' | ')} |`,
        );
        if (lines.length >= 1) {
          const cols = block.rows[0].length;
          lines.splice(1, 0, `| ${Array(cols).fill('---').join(' | ')} |`);
        }
        return lines.join('\n');
      }
    case 'mermaid':
      return `\`\`\`mermaid\n${block.raw || text}\n\`\`\``;
    default:
      return text;
  }
}

function blockToHtml(block: ContentBlock): string {
  const inner = spansToHtml(block);
  switch (block.type) {
    case 'heading1':
      return `<h1>${inner}</h1>`;
    case 'heading2':
      return `<h2>${inner}</h2>`;
    case 'heading3':
      return `<h3>${inner}</h3>`;
    case 'bullet':
      return `<li>${inner}</li>`;
    case 'numbered':
      return `<li>${inner}</li>`;
    case 'checkbox':
      return `<li><input type="checkbox" ${block.checked ? 'checked' : ''}/> ${inner}</li>`;
    case 'code':
      return `<pre><code>${escapeHtml(plainFromSpans(block.spans) || block.raw || '')}</code></pre>`;
    case 'quote':
      return `<blockquote>${inner}</blockquote>`;
    case 'divider':
      return '<hr/>';
    case 'table':
      if (!block.rows?.length) return '';
      return `<table>${block.rows
        .map(
          (row) =>
            `<tr>${row
              .map((c) => `<td>${escapeHtml(plainFromSpans(c.spans))}</td>`)
              .join('')}</tr>`,
        )
        .join('')}</table>`;
    default:
      return `<p>${inner}</p>`;
  }
}

export function exportMarkdown(doc: WorkspaceDocument): string {
  if (doc.body.mermaidSource) {
    return `# ${doc.title}\n\n\`\`\`mermaid\n${doc.body.mermaidSource}\n\`\`\`\n`;
  }
  const body = doc.body.blocks.map(blockToMarkdown).join('\n\n');
  return `# ${doc.title}\n\n${body}\n`;
}

export function exportHtml(doc: WorkspaceDocument): string {
  if (doc.body.htmlBody) return doc.body.htmlBody;
  const body = doc.body.blocks.map(blockToHtml).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(doc.title)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; line-height: 1.6; }
    h1,h2,h3 { color: #0f766e; font-family: system-ui, sans-serif; }
    code, pre { font-family: ui-monospace, monospace; background: #f1f5f9; }
    pre { padding: 1rem; overflow: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #cbd5e1; padding: 0.4rem 0.6rem; }
    mark { background: #fef08a; }
  </style>
</head>
<body>
  <article>
    <h1>${escapeHtml(doc.title)}</h1>
    ${body}
  </article>
</body>
</html>`;
}

export function exportTxt(doc: WorkspaceDocument): string {
  return `${doc.title}\n${'='.repeat(Math.min(doc.title.length, 48))}\n\n${documentPlainText(doc.body)}\n`;
}

export function exportJson(doc: WorkspaceDocument): string {
  return JSON.stringify(
    {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      updatedAt: doc.updatedAt,
      body: doc.body,
      tags: doc.tags,
    },
    null,
    2,
  );
}

export function exportSvg(doc: WorkspaceDocument): string {
  if (doc.body.svgMarkup?.trim()) return doc.body.svgMarkup;
  const lines = documentPlainText(doc.body)
    .split('\n')
    .slice(0, 12)
    .map((line, i) => {
      const y = 64 + i * 22;
      return `<text x="24" y="${y}" font-family="sans-serif" font-size="14" fill="#0F172A">${escapeHtml(line.slice(0, 64))}</text>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#F8FAFC"/>
  <text x="24" y="36" font-family="sans-serif" font-size="20" font-weight="700" fill="#0F766E">${escapeHtml(doc.title)}</text>
  ${lines}
</svg>`;
}
