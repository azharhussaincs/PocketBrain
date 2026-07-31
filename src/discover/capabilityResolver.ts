import type { ModelCapability } from '../types/models';
import type {
  AttachmentKind,
  ChatAttachment,
  InputCapability,
  RequestedTask,
} from '../types/attachments';
import type { WorkspaceDocType } from '../workspace/types/document';

export interface CapabilityResolution {
  inputCapabilities: InputCapability[];
  requestedTask: RequestedTask;
  /** Model capability required for this request (when AI is needed). */
  requiredCapability: ModelCapability | 'system';
  /** When set, route through Workspace AI Creator exporters. */
  workspaceDocType?: WorkspaceDocType;
  /** User-facing explanation when a path is blocked. */
  limitationMessage?: string;
  /** Short label for UI status. */
  label: string;
  confidence: 'high' | 'medium' | 'low';
}

const IMAGE_GEN =
  /\b(generate|create|draw|make|design)\b.{0,40}\b(image|logo|picture|illustration|artwork|icon)\b|\b(text[\s-]?to[\s-]?image|img2img)\b/i;
const VIDEO_GEN =
  /\b(generate|create|make)\b.{0,40}\b(video|clip|animation|reel)\b|\btext[\s-]?to[\s-]?video\b/i;
const PRESENTATION =
  /\b(powerpoint|presentation|pptx|\bslides?\b|deck)\b/i;
const SPREADSHEET =
  /\b(spreadsheet|excel|xlsx|csv|budget|invoice table|workbook)\b/i;
const PDF_DOC =
  /\b(pdf report|create (a )?pdf|generate (a )?pdf|export (as|to) pdf)\b/i;
const DOCX =
  /\b(word document|docx|\bresume\b|proposal|write (a |an )?(report|essay|article|letter))\b/i;
const SUMMARIZE = /\b(summar(y|ize|ise)|tldr|tl;dr|key points|brief)\b/i;
const TRANSLATE = /\b(translat(e|ion)|into (english|spanish|french|arabic|urdu|hindi|german|chinese))\b/i;
const OCR = /\b(ocr|extract text|read (the )?text from)\b/i;
const VISION = /\b(describe|analyze|analyse|what('s| is) in|look at).{0,30}\b(image|photo|picture|chart|screenshot)\b/i;
const CODE = /\b(code|function|debug|refactor|typescript|python|javascript|kotlin|java)\b/i;
const STT = /\b(transcri(be|ption)|speech[\s-]?to[\s-]?text|dictate)\b/i;
const TTS = /\b(text[\s-]?to[\s-]?speech|read (this |it )?aloud|speak (this|it))\b/i;

function kindToInput(kind: AttachmentKind): InputCapability {
  switch (kind) {
    case 'image':
      return 'IMAGE';
    case 'pdf':
      return 'PDF';
    case 'document':
    case 'markdown':
    case 'text':
      return 'DOCUMENT';
    case 'spreadsheet':
      return 'SPREADSHEET';
    case 'presentation':
      return 'PRESENTATION';
    case 'audio':
      return 'AUDIO';
    case 'video':
      return 'VIDEO';
    case 'code':
      return 'CODE';
    default:
      return 'DOCUMENT';
  }
}

function inputsFromAttachments(attachments: ChatAttachment[]): InputCapability[] {
  if (!attachments.length) return ['TEXT'];
  const caps = new Set<InputCapability>(attachments.map((a) => kindToInput(a.kind)));
  if (attachments.length > 1) caps.add('MULTI_FILE');
  if (!caps.has('TEXT') && attachments.every((a) => a.textExcerpt)) {
    caps.add('TEXT');
  }
  return [...caps];
}

/**
 * Maps free-form user intent + attachments to required capabilities.
 * Never invents support for runtimes that are not wired.
 */
export function resolveCapabilityRequest(
  prompt: string,
  attachments: ChatAttachment[] = [],
): CapabilityResolution {
  const text = prompt.trim();
  const inputCapabilities = inputsFromAttachments(attachments);
  const hasImages = attachments.some((a) => a.kind === 'image');
  const hasAudio = attachments.some((a) => a.kind === 'audio');
  const hasVideo = attachments.some((a) => a.kind === 'video');
  const hasDocs = attachments.some((a) =>
    ['pdf', 'document', 'markdown', 'text', 'spreadsheet', 'presentation'].includes(a.kind),
  );

  if (VIDEO_GEN.test(text) || (hasVideo && /\b(generate|create)\b/i.test(text))) {
    return {
      inputCapabilities,
      requestedTask: 'VIDEO_GENERATION',
      requiredCapability: 'system',
      label: 'Video generation',
      confidence: 'high',
      limitationMessage:
        'Video generation is not supported on this device/runtime yet. No fake video will be produced. Check Get → Video when a compatible local model/runtime is available.',
    };
  }

  if (IMAGE_GEN.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'IMAGE_GENERATION',
      requiredCapability: 'image_generation',
      label: 'Image generation',
      confidence: 'high',
      limitationMessage:
        'Local image generation needs a linked diffusion runtime and a compatible model. PocketBrain will not invent placeholder images.',
    };
  }

  if (PRESENTATION.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'PRESENTATION_GENERATION',
      requiredCapability: 'documents',
      workspaceDocType: 'presentation',
      label: 'Create presentation',
      confidence: 'high',
    };
  }

  if (SPREADSHEET.test(text) && /\b(create|generate|make|build)\b/i.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'SPREADSHEET_GENERATION',
      requiredCapability: 'documents',
      workspaceDocType: 'spreadsheet',
      label: 'Create spreadsheet',
      confidence: 'high',
    };
  }

  if (PDF_DOC.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'DOCUMENT_GENERATION',
      requiredCapability: 'documents',
      workspaceDocType: 'pdf',
      label: 'Create PDF',
      confidence: 'high',
    };
  }

  if (DOCX.test(text) && /\b(create|generate|write|make|draft)\b/i.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'DOCUMENT_GENERATION',
      requiredCapability: 'documents',
      workspaceDocType: 'document',
      label: 'Create document',
      confidence: 'medium',
    };
  }

  if (OCR.test(text) || (hasImages && OCR.test(text))) {
    return {
      inputCapabilities,
      requestedTask: 'OCR',
      requiredCapability: 'ocr',
      label: 'OCR',
      confidence: 'high',
    };
  }

  if (VISION.test(text) || (hasImages && /\b(describe|analyze|analyse|what)\b/i.test(text))) {
    return {
      inputCapabilities,
      requestedTask: 'VISION',
      requiredCapability: 'vision',
      label: 'Image understanding',
      confidence: 'high',
      limitationMessage:
        'Vision models in this build are limited: image pixels are not passed into the GGUF runtime yet. Use OCR for text extraction, or attach text/notes about the image.',
    };
  }

  if (STT.test(text) || (hasAudio && /\b(transcri|summar)/i.test(text))) {
    return {
      inputCapabilities,
      requestedTask: 'SPEECH_TO_TEXT',
      requiredCapability: 'speech',
      label: 'Speech to text',
      confidence: 'high',
    };
  }

  if (TTS.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'TEXT_TO_SPEECH',
      requiredCapability: 'tts',
      label: 'Text to speech',
      confidence: 'high',
    };
  }

  if (TRANSLATE.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'TRANSLATE',
      requiredCapability: 'translation',
      label: 'Translate',
      confidence: 'high',
    };
  }

  if (SUMMARIZE.test(text) || (hasDocs && SUMMARIZE.test(text))) {
    return {
      inputCapabilities,
      requestedTask: 'SUMMARIZE',
      requiredCapability: 'chat',
      label: 'Summarize',
      confidence: 'high',
    };
  }

  if (CODE.test(text)) {
    return {
      inputCapabilities,
      requestedTask: 'CODE',
      requiredCapability: 'coding',
      label: 'Coding',
      confidence: 'medium',
    };
  }

  if (hasImages && !text) {
    return {
      inputCapabilities,
      requestedTask: 'VISION',
      requiredCapability: 'vision',
      label: 'Image understanding',
      confidence: 'medium',
      limitationMessage:
        'Attach a prompt describing what you want, or use Home → OCR / Image Understanding. Pixel vision is limited in this runtime.',
    };
  }

  if (hasDocs && !text) {
    return {
      inputCapabilities,
      requestedTask: 'SUMMARIZE',
      requiredCapability: 'chat',
      label: 'Document assist',
      confidence: 'medium',
    };
  }

  return {
    inputCapabilities,
    requestedTask: 'CHAT',
    requiredCapability: 'chat',
    label: 'Chat',
    confidence: 'low',
  };
}

export function formatAttachmentContext(attachments: ChatAttachment[]): string {
  if (!attachments.length) return '';
  const parts = attachments.map((a, i) => {
    const header = `[Attachment ${i + 1}] ${a.name} (${a.kind}, ${formatSize(a.sizeBytes)})`;
    if (a.status === 'error' || a.status === 'unsupported') {
      return `${header}\nStatus: ${a.errorMessage ?? a.status}`;
    }
    if (a.textExcerpt?.trim()) {
      const excerpt =
        a.textExcerpt.length > 12_000
          ? `${a.textExcerpt.slice(0, 12_000)}\n…[truncated]`
          : a.textExcerpt;
      return `${header}\nContent:\n${excerpt}`;
    }
    if (a.kind === 'image') {
      return `${header}\nNote: Image file attached. This text model cannot see pixels; describe the image in your prompt or use OCR/Vision tools.`;
    }
    if (a.kind === 'pdf' || a.kind === 'document' || a.kind === 'presentation') {
      return `${header}\nNote: Binary office/PDF text extraction is limited. Filename and metadata are available; paste key passages if you need a deep summary.`;
    }
    return `${header}\n(No extractable text in this build.)`;
  });
  return `\n\n--- Attached files ---\n${parts.join('\n\n')}\n--- End attachments ---`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
