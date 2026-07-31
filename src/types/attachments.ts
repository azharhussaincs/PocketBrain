export type AttachmentKind =
  | 'text'
  | 'markdown'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'other';

export type AttachmentStatus = 'ready' | 'processing' | 'error' | 'unsupported';

export interface ChatAttachment {
  id: string;
  uri: string;
  name: string;
  mimeType?: string;
  sizeBytes: number;
  kind: AttachmentKind;
  /** Extracted text for models that only accept text prompts. */
  textExcerpt?: string;
  status: AttachmentStatus;
  errorMessage?: string;
}

export type InputCapability =
  | 'TEXT'
  | 'IMAGE'
  | 'PDF'
  | 'DOCUMENT'
  | 'SPREADSHEET'
  | 'PRESENTATION'
  | 'AUDIO'
  | 'VIDEO'
  | 'CODE'
  | 'MULTI_FILE';

export type RequestedTask =
  | 'CHAT'
  | 'SUMMARIZE'
  | 'TRANSLATE'
  | 'EXTRACT'
  | 'ANALYZE'
  | 'OCR'
  | 'VISION'
  | 'WRITE'
  | 'EDIT'
  | 'DESIGN'
  | 'IMAGE_GENERATION'
  | 'AUDIO_GENERATION'
  | 'SPEECH_TO_TEXT'
  | 'TEXT_TO_SPEECH'
  | 'VIDEO_GENERATION'
  | 'DOCUMENT_GENERATION'
  | 'PRESENTATION_GENERATION'
  | 'SPREADSHEET_GENERATION'
  | 'CODE'
  | 'REASONING';
