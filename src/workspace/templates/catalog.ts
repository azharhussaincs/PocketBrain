import { createId } from '../../utils/format';
import type { WorkspaceTemplate } from '../types/document';
import { createBlock, ensureSlide, spansFromPlain } from '../utils/blocks';

function tpl(
  partial: Omit<WorkspaceTemplate, 'id'> & { id?: string },
): WorkspaceTemplate {
  return { id: partial.id ?? createId(), ...partial };
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  tpl({
    id: 'biz-resume',
    name: 'Professional Resume',
    description: 'Clean resume with summary, experience, education, and skills.',
    category: 'business',
    type: 'document',
    promptHint: 'Write a professional resume for a software engineer with 5 years experience',
    body: {
      blocks: [
        createBlock('heading1', 'Your Name'),
        createBlock('paragraph', 'City · email@example.com · +1 000 000 0000'),
        createBlock('heading2', 'Professional Summary'),
        createBlock('paragraph', 'Results-driven professional with impact across product delivery.'),
        createBlock('heading2', 'Experience'),
        createBlock('bullet', 'Company — Role (20XX–Present)'),
        createBlock('bullet', 'Led initiatives that improved delivery speed and quality.'),
        createBlock('heading2', 'Education'),
        createBlock('bullet', 'Degree — University'),
        createBlock('heading2', 'Skills'),
        createBlock('bullet', 'Communication, leadership, domain tools'),
      ],
    },
  }),
  tpl({
    id: 'biz-proposal',
    name: 'Project Proposal',
    description: 'Problem, solution, timeline, budget, and next steps.',
    category: 'business',
    type: 'document',
    promptHint: 'Create a project proposal for a mobile AI workspace product',
    body: {
      blocks: [
        createBlock('heading1', 'Project Proposal'),
        createBlock('heading2', 'Executive Summary'),
        createBlock('paragraph', 'Brief overview of the opportunity and recommended approach.'),
        createBlock('heading2', 'Problem'),
        createBlock('paragraph', 'Describe the customer problem.'),
        createBlock('heading2', 'Proposed Solution'),
        createBlock('paragraph', 'Explain the solution and differentiators.'),
        createBlock('heading2', 'Timeline'),
        createBlock('numbered', 'Discovery'),
        createBlock('numbered', 'Build'),
        createBlock('numbered', 'Launch'),
        createBlock('heading2', 'Budget'),
        createBlock('paragraph', 'High-level cost breakdown.'),
      ],
    },
  }),
  tpl({
    id: 'biz-invoice',
    name: 'Invoice',
    description: 'Itemized invoice ready for spreadsheet or PDF export.',
    category: 'finance',
    type: 'spreadsheet',
    promptHint: 'Create an invoice for consulting services totaling 4500 USD',
    body: {
      blocks: [createBlock('heading1', 'Invoice')],
      spreadsheet: {
        sheetName: 'Invoice',
        columns: ['Item', 'Qty', 'Unit Price', 'Amount'],
        rows: [
          [{ value: 'Consulting' }, { value: 10 }, { value: 150 }, { value: 1500 }],
          [{ value: 'Implementation' }, { value: 20 }, { value: 150 }, { value: 3000 }],
          [{ value: 'Total' }, { value: '' }, { value: '' }, { value: 4500 }],
        ],
      },
    },
  }),
  tpl({
    id: 'fin-budget',
    name: 'Monthly Budget',
    description: 'Income and expense tracker with totals.',
    category: 'finance',
    type: 'spreadsheet',
    promptHint: 'Build a monthly household budget spreadsheet',
    body: {
      blocks: [createBlock('heading1', 'Monthly Budget')],
      spreadsheet: {
        sheetName: 'Budget',
        columns: ['Category', 'Planned', 'Actual', 'Delta'],
        rows: [
          [{ value: 'Income' }, { value: 5000 }, { value: 5000 }, { value: 0 }],
          [{ value: 'Rent' }, { value: 1500 }, { value: 1500 }, { value: 0 }],
          [{ value: 'Food' }, { value: 600 }, { value: 540 }, { value: 60 }],
          [{ value: 'Transport' }, { value: 200 }, { value: 180 }, { value: 20 }],
        ],
      },
    },
  }),
  tpl({
    id: 'acad-lecture',
    name: 'Lecture Notes',
    description: 'Structured notes with objectives and key takeaways.',
    category: 'academic',
    type: 'markdown',
    promptHint: 'Create lecture notes about neural networks for beginners',
    body: {
      blocks: [
        createBlock('heading1', 'Lecture Notes'),
        createBlock('heading2', 'Learning Objectives'),
        createBlock('checkbox', 'Understand core concepts', { checked: false }),
        createBlock('checkbox', 'Apply concepts to examples', { checked: false }),
        createBlock('heading2', 'Key Ideas'),
        createBlock('bullet', 'Concept 1'),
        createBlock('bullet', 'Concept 2'),
        createBlock('heading2', 'Summary'),
        createBlock('paragraph', 'Summarize the lecture in your own words.'),
      ],
    },
  }),
  tpl({
    id: 'edu-assignment',
    name: 'Assignment Brief',
    description: 'Assignment instructions, rubric, and submission checklist.',
    category: 'education',
    type: 'document',
    promptHint: 'Create an assignment brief for a React Native course project',
    body: {
      blocks: [
        createBlock('heading1', 'Assignment'),
        createBlock('heading2', 'Brief'),
        createBlock('paragraph', 'Describe the task and constraints.'),
        createBlock('heading2', 'Deliverables'),
        createBlock('numbered', 'Source code'),
        createBlock('numbered', 'Write-up'),
        createBlock('heading2', 'Rubric'),
        createBlock('bullet', 'Correctness — 40%'),
        createBlock('bullet', 'Design — 30%'),
        createBlock('bullet', 'Documentation — 30%'),
      ],
    },
  }),
  tpl({
    id: 'soft-api',
    name: 'API Documentation',
    description: 'Endpoints, auth, request/response examples.',
    category: 'software',
    type: 'markdown',
    promptHint: 'Generate API documentation for a local model inference REST API',
    body: {
      blocks: [
        createBlock('heading1', 'API Documentation'),
        createBlock('heading2', 'Authentication'),
        createBlock('paragraph', 'Describe auth requirements.'),
        createBlock('heading2', 'Endpoints'),
        createBlock('heading3', 'POST /v1/generate'),
        createBlock('code', '{\n  "prompt": "Hello",\n  "max_tokens": 256\n}', {
          language: 'json',
        }),
        createBlock('heading2', 'Errors'),
        createBlock('bullet', '400 — Invalid request'),
        createBlock('bullet', '500 — Runtime failure'),
      ],
    },
  }),
  tpl({
    id: 'soft-readme',
    name: 'Software README',
    description: 'Project overview, setup, and usage.',
    category: 'software',
    type: 'markdown',
    promptHint: 'Write software documentation for an offline AI mobile app',
    body: {
      blocks: [
        createBlock('heading1', 'Project Name'),
        createBlock('paragraph', 'Short description of the product.'),
        createBlock('heading2', 'Features'),
        createBlock('bullet', 'Feature one'),
        createBlock('heading2', 'Setup'),
        createBlock('code', 'npm install\nnpm start', { language: 'bash' }),
        createBlock('heading2', 'Usage'),
        createBlock('paragraph', 'Explain how to use the product.'),
      ],
    },
  }),
  tpl({
    id: 'mkt-pitch',
    name: 'Pitch Deck',
    description: 'Investor-style slides with speaker notes.',
    category: 'marketing',
    type: 'presentation',
    promptHint: 'Create a pitch deck for an offline AI operating system on mobile',
    body: {
      blocks: [createBlock('heading1', 'Pitch Deck')],
      slides: [
        ensureSlide({ title: 'Problem', bullets: ['Pain point 1', 'Pain point 2'] }),
        ensureSlide({ title: 'Solution', bullets: ['Our product', 'Why now'] }),
        ensureSlide({
          title: 'Market',
          bullets: ['TAM', 'SAM', 'SOM'],
          chart: {
            title: 'Market segments',
            kind: 'bar',
            labels: ['TAM', 'SAM', 'SOM'],
            values: [100, 40, 8],
          },
        }),
        ensureSlide({ title: 'Ask', bullets: ['Funding ask', 'Use of funds'] }),
      ],
    },
  }),
  tpl({
    id: 'legal-agreement',
    name: 'Service Agreement',
    description: 'Outline of parties, scope, terms, and signatures.',
    category: 'legal',
    type: 'document',
    promptHint: 'Draft a simple service agreement between a freelancer and a client',
    body: {
      blocks: [
        createBlock('heading1', 'Service Agreement'),
        createBlock('heading2', 'Parties'),
        createBlock('paragraph', 'This agreement is between Provider and Client.'),
        createBlock('heading2', 'Scope of Work'),
        createBlock('paragraph', 'Describe deliverables and exclusions.'),
        createBlock('heading2', 'Fees & Payment'),
        createBlock('paragraph', 'Payment schedule and method.'),
        createBlock('heading2', 'Term & Termination'),
        createBlock('paragraph', 'Start date, end date, and termination terms.'),
        createBlock('heading2', 'Signatures'),
        createBlock('paragraph', 'Provider: ____________________'),
        createBlock('paragraph', 'Client: ______________________'),
      ],
    },
  }),
  tpl({
    id: 'health-visit',
    name: 'Visit Summary',
    description: 'Clinical visit notes structure (local only).',
    category: 'healthcare',
    type: 'note',
    promptHint: 'Create a patient visit summary template for a general checkup',
    body: {
      blocks: [
        createBlock('heading1', 'Visit Summary'),
        createBlock('heading2', 'Chief Complaint'),
        createBlock('paragraph', ''),
        createBlock('heading2', 'Assessment'),
        createBlock('paragraph', ''),
        createBlock('heading2', 'Plan'),
        createBlock('bullet', 'Follow-up'),
        createBlock('bullet', 'Medications / advice'),
      ],
    },
  }),
  tpl({
    id: 'eng-spec',
    name: 'Engineering Spec',
    description: 'Requirements, design, risks, and test plan.',
    category: 'engineering',
    type: 'document',
    promptHint: 'Write an engineering specification for on-device model downloads',
    body: {
      blocks: [
        createBlock('heading1', 'Engineering Specification'),
        createBlock('heading2', 'Goals'),
        createBlock('bullet', 'Goal 1'),
        createBlock('heading2', 'Non-goals'),
        createBlock('bullet', 'Out of scope item'),
        createBlock('heading2', 'Design'),
        createBlock('paragraph', 'Describe architecture and data flow.'),
        createBlock('heading2', 'Risks'),
        createBlock('bullet', 'Risk and mitigation'),
        createBlock('heading2', 'Test Plan'),
        createBlock('checkbox', 'Unit tests', { checked: false }),
        createBlock('checkbox', 'Device tests', { checked: false }),
      ],
    },
  }),
  tpl({
    id: 'personal-meeting',
    name: 'Meeting Minutes',
    description: 'Attendees, agenda, decisions, and action items.',
    category: 'personal',
    type: 'document',
    promptHint: 'Create meeting minutes for a weekly product sync',
    body: {
      blocks: [
        createBlock('heading1', 'Meeting Minutes'),
        createBlock('paragraph', 'Date · Attendees'),
        createBlock('heading2', 'Agenda'),
        createBlock('numbered', 'Topic 1'),
        createBlock('heading2', 'Decisions'),
        createBlock('bullet', 'Decision 1'),
        createBlock('heading2', 'Action Items'),
        createBlock('checkbox', 'Owner — task', { checked: false }),
      ],
    },
  }),
  tpl({
    id: 'soft-mermaid',
    name: 'System Flowchart',
    description: 'Mermaid flowchart starter for architecture diagrams.',
    category: 'software',
    type: 'mermaid',
    promptHint: 'Create a mermaid flowchart for model download and inference',
    body: {
      blocks: [createBlock('heading1', 'System Flow')],
      mermaidSource:
        'flowchart LR\n  A[Marketplace] --> B[Download Manager]\n  B --> C[Model Manager]\n  C --> D[Inference Engine]\n  D --> E[Workspace]',
    },
  }),
  tpl({
    id: 'biz-report-pdf',
    name: 'Business Report (PDF)',
    description: 'Print-ready report structure for PDF export.',
    category: 'business',
    type: 'pdf',
    promptHint: 'Generate a quarterly business report with highlights and risks',
    body: {
      blocks: [
        createBlock('heading1', 'Quarterly Business Report'),
        createBlock('heading2', 'Highlights'),
        createBlock('bullet', 'Highlight 1'),
        createBlock('heading2', 'Metrics'),
        {
          id: createId(),
          type: 'table',
          rows: [
            [
              { spans: spansFromPlain('Metric') },
              { spans: spansFromPlain('Value') },
            ],
            [
              { spans: spansFromPlain('Revenue') },
              { spans: spansFromPlain('—') },
            ],
          ],
        },
        createBlock('heading2', 'Risks & Outlook'),
        createBlock('paragraph', 'Summarize risks and next-quarter outlook.'),
      ],
    },
  }),
];

export function getTemplateById(id: string): WorkspaceTemplate | undefined {
  return WORKSPACE_TEMPLATES.find((t) => t.id === id);
}

export function templatesByCategory(category?: string): WorkspaceTemplate[] {
  if (!category || category === 'all') return WORKSPACE_TEMPLATES;
  return WORKSPACE_TEMPLATES.filter((t) => t.category === category);
}
