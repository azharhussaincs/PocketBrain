import type { ChatAttachment } from './attachments';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  modelId?: string;
  streaming?: boolean;
  favorite?: boolean;
  attachments?: ChatAttachment[];
  workspaceDocumentId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  folderId?: string;
  pinned: boolean;
  favorite?: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelId?: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  createdAt: number;
}
