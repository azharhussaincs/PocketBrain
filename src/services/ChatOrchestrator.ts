import { Alert } from 'react-native';
import type { ChatAttachment } from '../types/attachments';
import type { ChatMessage } from '../types/chat';
import type { ModelCapability } from '../types/models';
import {
  formatAttachmentContext,
  resolveCapabilityRequest,
  type CapabilityResolution,
} from '../discover/capabilityResolver';
import { gateForCapability } from '../discover/FeatureGate';
import { aiService } from './AIService';
import { modelManager } from './ModelManager';
import { workspaceService } from '../workspace/services/WorkspaceService';
import { getListingById } from '../data/catalog';
import type { InferenceToken } from '../types/inference';

export interface OrchestratorSendInput {
  prompt: string;
  attachments: ChatAttachment[];
  history: ChatMessage[];
  modelId: string;
  gpuEnabled?: boolean;
  nCtx?: number;
  signal?: AbortSignal;
  onToken?: (token: InferenceToken) => void;
  onStatus?: (label: string) => void;
}

export interface OrchestratorSendResult {
  text: string;
  resolution: CapabilityResolution;
  workspaceDocumentId?: string;
  cancelled?: boolean;
}

function humanModelError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const lower = raw.toLowerCase();

  if (!raw || raw === 'undefined' || raw === 'Error') {
    return 'Generation failed for an unknown reason. Try again, switch to a smaller model, or reopen Chat.';
  }
  if (lower.includes('abort') || lower.includes('cancel')) {
    return 'Generation stopped.';
  }
  if (
    lower.includes('out of memory') ||
    lower.includes('oom') ||
    lower.includes('ENOMEM') ||
    lower.includes('memory')
  ) {
    return [
      'The selected model could not run on this device (likely out of memory).',
      '',
      'Try:',
      '• a smaller model',
      '• lower context size in Settings',
      '• fewer CPU threads',
      '• another compatible model from Get',
    ].join('\n');
  }
  if (lower.includes('no installed model') || lower.includes('missing from device')) {
    return 'No text model is installed (or the file is missing). Download a Text model from Get to continue.';
  }
  if (lower.includes('native llama') || lower.includes('runtime is not available')) {
    return raw;
  }
  return raw;
}

function pickModelForCapability(
  preferredModelId: string,
  capability: ModelCapability | 'system',
): { modelId: string; warning?: string } {
  if (capability === 'system') {
    return { modelId: preferredModelId };
  }

  const preferred = modelManager.get(preferredModelId);
  const listing = getListingById(preferredModelId);
  const caps = listing?.capabilities ?? [];
  if (preferred?.status === 'installed') {
    if (
      capability === 'chat' ||
      capability === 'documents' ||
      caps.includes(capability) ||
      caps.includes('chat')
    ) {
      // documents / summarize / translate often work with any chat GGUF
      if (
        capability === 'documents' ||
        capability === 'translation' ||
        capability === 'coding' ||
        capability === 'reasoning' ||
        capability === 'chat'
      ) {
        return { modelId: preferredModelId };
      }
      if (caps.includes(capability)) {
        return { modelId: preferredModelId };
      }
    }
  }

  const installed = modelManager.list().filter((m) => m.status === 'installed');
  const match = installed.find((m) => {
    const l = getListingById(m.listingId);
    return l?.capabilities?.includes(capability);
  });
  if (match) {
    return {
      modelId: match.listingId,
      warning: `Switched to ${match.localName} for this task.`,
    };
  }

  // Fall back to any chat model for document generation / summarize
  if (
    capability === 'documents' ||
    capability === 'translation' ||
    capability === 'coding' ||
    capability === 'reasoning'
  ) {
    const chat = installed.find((m) => {
      const l = getListingById(m.listingId);
      return !l?.capabilities || l.capabilities.includes('chat');
    });
    if (chat) return { modelId: chat.listingId };
  }

  return { modelId: preferredModelId };
}

function buildHistoryPrompt(history: ChatMessage[], nextUser: string): string {
  const recent = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => m.content.trim().length > 0)
    .slice(-8);

  const lines: string[] = [];
  for (const m of recent) {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    lines.push(`${role}: ${m.content.trim()}`);
  }
  lines.push(`User: ${nextUser}`);
  lines.push('Assistant:');
  return lines.join('\n');
}

/**
 * Central send pipeline: validate → resolve capability → gate → infer / create docs.
 * Never fails silently.
 */
export class ChatOrchestrator {
  resolve(prompt: string, attachments: ChatAttachment[]): CapabilityResolution {
    return resolveCapabilityRequest(prompt, attachments);
  }

  assertCanSend(prompt: string, attachments: ChatAttachment[], modelId?: string): string | null {
    if (!prompt.trim() && attachments.length === 0) {
      return 'Type a message or attach a file before sending.';
    }
    if (!modelId) {
      return 'No text model is installed. Download a Text model from Get to continue.';
    }
    const installed = modelManager.get(modelId);
    if (!installed || installed.status !== 'installed') {
      return 'The selected model is not installed. Open Get and install a compatible model.';
    }
    return null;
  }

  async send(input: OrchestratorSendInput): Promise<OrchestratorSendResult> {
    const resolution = this.resolve(input.prompt, input.attachments);
    input.onStatus?.(resolution.label);

    if (resolution.limitationMessage && resolution.requestedTask === 'VIDEO_GENERATION') {
      return { text: resolution.limitationMessage, resolution };
    }

    if (resolution.requestedTask === 'IMAGE_GENERATION') {
      const gate = gateForCapability('image_generation');
      if (!gate.ready) {
        const recs = gate.recommendations
          .slice(0, 3)
          .map((r) => `• ${r.friendlyName}`)
          .join('\n');
        return {
          text: [
            resolution.limitationMessage ?? gate.message,
            '',
            recs ? `Recommended models:\n${recs}` : 'Open Get → Images when a diffusion model/runtime is listed.',
            '',
            'PocketBrain will not show a fake generated image.',
          ].join('\n'),
          resolution,
        };
      }
    }

    if (resolution.requestedTask === 'VISION') {
      const gate = gateForCapability('vision');
      if (!gate.ready) {
        return {
          text: [
            'No vision-capable model is installed.',
            gate.message,
            '',
            'You can still attach the image and describe what you need in text, or use Home → OCR Scanner for on-device text extraction.',
          ].join('\n'),
          resolution,
        };
      }
      if (resolution.limitationMessage) {
        // Soft-continue with text context so the user still gets a useful reply
        input.onStatus?.('Vision limited — using text context');
      }
    }

    const { modelId, warning } = pickModelForCapability(
      input.modelId,
      resolution.requiredCapability === 'system' ? 'chat' : resolution.requiredCapability,
    );
    if (warning) input.onStatus?.(warning);

    const attachmentBlock = formatAttachmentContext(input.attachments);
    const userPayload = `${input.prompt.trim() || 'Please help with the attached file(s).'}${attachmentBlock}`;

    try {
      if (resolution.workspaceDocType) {
        input.onStatus?.(`Creating ${resolution.workspaceDocType}…`);
        const doc = await workspaceService.createWithAI({
          prompt: userPayload,
          type: resolution.workspaceDocType,
          modelId,
          onToken: input.onToken
            ? (token) => input.onToken?.({ token, done: false })
            : undefined,
          signal: input.signal,
        });
        input.onToken?.({ token: '', done: true });

        const exportHint =
          resolution.workspaceDocType === 'presentation'
            ? 'Open it in Workspace to preview, then export PPTX/PDF and share from Files.'
            : resolution.workspaceDocType === 'spreadsheet'
              ? 'Open it in Workspace to export XLSX/CSV.'
              : 'Open it in Workspace to export DOCX/PDF and share.';

        return {
          text: [
            warning ? `${warning}\n` : '',
            `Created “${doc.title}” (${resolution.workspaceDocType}).`,
            exportHint,
            '',
            'Document ID: ' + doc.id,
          ]
            .filter(Boolean)
            .join('\n'),
          resolution,
          workspaceDocumentId: doc.id,
        };
      }

      input.onStatus?.(`Generating · ${getListingById(modelId)?.name ?? modelId}`);
      const historyPrompt = buildHistoryPrompt(input.history, userPayload);
      const result = await aiService.generateText({
        modelId,
        prompt: historyPrompt,
        systemPrompt:
          'You are PocketBrain, a private on-device AI workspace assistant. Be accurate. If an attachment cannot be fully read, say so clearly. Do not invent file contents, images, or videos.',
        gpuEnabled: input.gpuEnabled,
        nCtx: input.nCtx,
        signal: input.signal,
        onToken: input.onToken,
        // Prompt already includes User/Assistant turns — avoid double-wrapping
        rawPrompt: true,
      });

      const text = (result.text || '').trim();
      if (result.cancelled) {
        return {
          text: text || 'Generation stopped.',
          resolution,
          cancelled: true,
        };
      }
      if (!text) {
        return {
          text: 'The model returned an empty response. Try rephrasing, using a larger max-tokens setting, or another model.',
          resolution,
        };
      }
      return {
        text: warning ? `${warning}\n\n${text}` : text,
        resolution,
      };
    } catch (error) {
      throw new Error(humanModelError(error));
    }
  }

  explainBlocked(message: string, goGet?: () => void): void {
    Alert.alert('Cannot send', message, [
      { text: 'OK', style: 'cancel' },
      ...(goGet
        ? [{ text: 'Open Get', onPress: goGet }]
        : []),
    ]);
  }
}

export const chatOrchestrator = new ChatOrchestrator();
