export type WorkspaceDocType =
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'pdf'
  | 'markdown'
  | 'html'
  | 'note'
  | 'code'
  | 'json'
  | 'csv'
  | 'mermaid'
  | 'svg';

export type ExportFormat =
  | 'docx'
  | 'pdf'
  | 'pptx'
  | 'xlsx'
  | 'markdown'
  | 'html'
  | 'txt'
  | 'json'
  | 'csv'
  | 'svg';

export type TemplateCategory =
  | 'business'
  | 'academic'
  | 'personal'
  | 'software'
  | 'finance'
  | 'marketing'
  | 'healthcare'
  | 'legal'
  | 'engineering'
  | 'education';

export type TextMark = 'bold' | 'italic' | 'underline' | 'highlight' | 'code';

export interface TextSpan {
  text: string;
  marks?: TextMark[];
  link?: string;
}

export type BlockType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bullet'
  | 'numbered'
  | 'checkbox'
  | 'code'
  | 'quote'
  | 'divider'
  | 'table'
  | 'image'
  | 'mermaid'
  | 'svg';

export interface TableCell {
  spans: TextSpan[];
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  spans?: TextSpan[];
  checked?: boolean;
  language?: string;
  rows?: TableCell[][];
  imageUri?: string;
  alt?: string;
  raw?: string;
}

export interface SlideChartPlaceholder {
  title: string;
  kind: 'bar' | 'line' | 'pie';
  labels: string[];
  values: number[];
}

export interface SlideContent {
  id: string;
  title: string;
  bullets: string[];
  notes?: string;
  chart?: SlideChartPlaceholder;
}

export interface SheetCell {
  value: string | number | boolean | null;
  formula?: string;
}

export interface SpreadsheetData {
  sheetName: string;
  columns: string[];
  rows: SheetCell[][];
}

export interface DocumentBody {
  blocks: ContentBlock[];
  slides?: SlideContent[];
  spreadsheet?: SpreadsheetData;
  svgMarkup?: string;
  mermaidSource?: string;
  codeLanguage?: string;
  htmlBody?: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentVersion {
  id: string;
  createdAt: number;
  label: string;
  sizeBytes: number;
  snapshotPath: string;
}

export interface WorkspaceDocumentMeta {
  id: string;
  title: string;
  type: WorkspaceDocType;
  folderId: string | null;
  pinned: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  sizeBytes: number;
  templateId?: string;
  tags: string[];
  modelId?: string;
}

export interface WorkspaceDocument extends WorkspaceDocumentMeta {
  body: DocumentBody;
  versions: DocumentVersion[];
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: WorkspaceDocType;
  promptHint: string;
  body: DocumentBody;
}

export interface WorkspaceIndex {
  version: 1;
  folders: WorkspaceFolder[];
  documents: WorkspaceDocumentMeta[];
  updatedAt: number;
}

export interface CreateDocumentInput {
  title: string;
  type: WorkspaceDocType;
  folderId?: string | null;
  templateId?: string;
  body?: DocumentBody;
  modelId?: string;
  tags?: string[];
}

export interface WorkspaceSearchQuery {
  text?: string;
  type?: WorkspaceDocType | 'all';
  folderId?: string | null;
  favorite?: boolean;
  pinned?: boolean;
  recentDays?: number;
  sortBy?: 'updatedAt' | 'title' | 'createdAt' | 'lastOpenedAt' | 'sizeBytes';
  sortDir?: 'asc' | 'desc';
}

export type AIEditAction =
  | 'rewrite'
  | 'summarize'
  | 'expand'
  | 'shorten'
  | 'grammar'
  | 'tone_professional'
  | 'tone_friendly'
  | 'tone_academic'
  | 'translate'
  | 'bullets'
  | 'readability'
  | 'continue';
