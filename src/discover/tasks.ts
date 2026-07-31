import type { ModelCapability } from '../types/models';

export type TaskId =
  | 'documents'
  | 'presentation'
  | 'files'
  | 'study'
  | 'coding'
  | 'image'
  | 'vision'
  | 'speech'
  | 'voice'
  | 'translate'
  | 'ocr'
  | 'spreadsheet'
  | 'chat'
  | 'video';

export interface AiTask {
  id: TaskId;
  title: string;
  subtitle: string;
  icon: string;
  /** Plain-language benefit */
  benefit: string;
  capability: ModelCapability | 'system';
  playgroundMode?: string;
  workspaceType?: string;
  recommendedModelIds: string[];
  beginner?: boolean;
  experimental?: boolean;
}

/**
 * Task-first catalog — users pick what they want to do, not a model family name.
 */
export const AI_TASKS: AiTask[] = [
  {
    id: 'documents',
    title: 'Write Documents',
    subtitle: 'Resumes, proposals, notes, exports',
    icon: 'file-document-outline',
    benefit: 'Create DOCX, PDF, and more from local AI drafts.',
    capability: 'documents',
    playgroundMode: 'documents',
    workspaceType: 'document',
    recommendedModelIds: ['smollm2-360m-instruct-q4', 'phi-35-mini-q4', 'llama32-1b-instruct-q4'],
    beginner: true,
  },
  {
    id: 'presentation',
    title: 'Create Presentation',
    subtitle: 'AI slides you can export as PPTX',
    icon: 'projector-screen-outline',
    benefit: 'Generate a real PowerPoint from a topic, then export and share.',
    capability: 'documents',
    playgroundMode: 'documents',
    workspaceType: 'presentation',
    recommendedModelIds: ['smollm2-360m-instruct-q4', 'qwen25-05b-instruct-q4'],
    beginner: true,
  },
  {
    id: 'study',
    title: 'Study Assistant',
    subtitle: 'Lecture notes, summaries, explainers',
    icon: 'school-outline',
    benefit: 'Turn topics into clear notes you can export.',
    capability: 'chat',
    playgroundMode: 'documents',
    recommendedModelIds: ['smollm2-360m-instruct-q4', 'qwen25-05b-instruct-q4'],
    beginner: true,
  },
  {
    id: 'files',
    title: 'My Files',
    subtitle: 'Documents, exports, and AI outputs',
    icon: 'folder-outline',
    benefit: 'Browse, preview, share, and reopen everything saved on this phone.',
    capability: 'system',
    recommendedModelIds: [],
    beginner: true,
  },
  {
    id: 'coding',
    title: 'Coding Assistant',
    subtitle: 'Write and explain code offline',
    icon: 'code-tags',
    benefit: 'Local coding help for snippets and explanations.',
    capability: 'coding',
    playgroundMode: 'code',
    recommendedModelIds: ['qwen25-coder-05b-q4', 'phi-35-mini-q4'],
  },
  {
    id: 'image',
    title: 'Create Image',
    subtitle: 'Text-to-image when a diffusion runtime is linked',
    icon: 'image-outline',
    benefit: 'Guided setup for on-device image generation models.',
    capability: 'image_generation',
    playgroundMode: 'image',
    recommendedModelIds: [],
  },
  {
    id: 'vision',
    title: 'Analyze Image',
    subtitle: 'Limited — pixels not loaded into GGUF yet',
    icon: 'eye-outline',
    benefit:
      'Install a vision-tagged model to open the limited Vision tool. This build does not pass image pixels into the runtime.',
    capability: 'vision',
    playgroundMode: 'vision',
    recommendedModelIds: ['smolvlm-256m-instruct-q4'],
  },
  {
    id: 'speech',
    title: 'Voice / Speech',
    subtitle: 'Speech-to-text on this device',
    icon: 'microphone-outline',
    benefit: 'Prefer on-device recognition; mic only when you listen.',
    capability: 'speech',
    playgroundMode: 'speech',
    recommendedModelIds: ['system-stt'],
    beginner: true,
  },
  {
    id: 'voice',
    title: 'Hear replies',
    subtitle: 'Text-to-speech with device voices',
    icon: 'volume-high',
    benefit: 'Hear responses using system text-to-speech.',
    capability: 'tts',
    playgroundMode: 'voice',
    recommendedModelIds: ['system-tts'],
    beginner: true,
  },
  {
    id: 'translate',
    title: 'Translator',
    subtitle: 'Translate text with a local model',
    icon: 'translate',
    benefit: 'Quick translations without cloud APIs.',
    capability: 'translation',
    playgroundMode: 'translate',
    recommendedModelIds: ['qwen25-05b-instruct-q4', 'smollm2-360m-instruct-q4'],
  },
  {
    id: 'ocr',
    title: 'OCR Scanner',
    subtitle: 'Extract text from images',
    icon: 'text-recognition',
    benefit: 'On-device OCR; export straight into Workspace.',
    capability: 'ocr',
    playgroundMode: 'ocr',
    recommendedModelIds: ['system-ocr'],
    beginner: true,
  },
  {
    id: 'spreadsheet',
    title: 'Spreadsheets',
    subtitle: 'Budgets, invoices, tables',
    icon: 'table',
    benefit: 'Generate sheets and export CSV/XLSX.',
    capability: 'documents',
    playgroundMode: 'documents',
    workspaceType: 'spreadsheet',
    recommendedModelIds: ['smollm2-360m-instruct-q4', 'qwen25-05b-instruct-q4'],
  },
  {
    id: 'chat',
    title: 'Chat',
    subtitle: 'Ask questions privately on this device',
    icon: 'chat-processing-outline',
    benefit: 'Fast answers without sending chats to the cloud. Attach files in the composer.',
    capability: 'chat',
    playgroundMode: 'chat',
    recommendedModelIds: ['smollm2-135m-instruct-q4', 'smollm2-360m-instruct-q4', 'qwen25-05b-instruct-q4'],
    beginner: true,
  },
  {
    id: 'video',
    title: 'Video',
    subtitle: 'Not supported on this runtime yet',
    icon: 'movie-open-outline',
    benefit: 'Honestly blocked until a compatible local video model/runtime ships.',
    capability: 'system',
    recommendedModelIds: [],
    experimental: true,
  },
];

export function getTaskById(id: TaskId): AiTask | undefined {
  return AI_TASKS.find((t) => t.id === id);
}
