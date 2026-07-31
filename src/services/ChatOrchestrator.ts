import { Alert } from 'react-native';
import type { ChatAttachment } from '../types/attachments';
import type { ChatMessage } from '../types/chat';
import type { ModelCapability } from '../types/models';
import {
  formatAttachmentContext,
  resolveCapabilityRequest,
  type CapabilityResolution,
} from '../discover/capabilityResolver';
import { capabilityToCollection, capabilityLabel } from '../discover/capabilityNav';
import { gateForCapability } from '../discover/FeatureGate';
import type { MarketplaceCollectionId } from '../discover/recommendations';
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

export interface OrchestratorNeedModel {
  capability: ModelCapability | 'system';
  collection: MarketplaceCollectionId;
  message: string;
}

export interface OrchestratorSendResult {
  text: string;
  resolution: CapabilityResolution;
  workspaceDocumentId?: string;
  cancelled?: boolean;
  /** Auto-switched to this installed model for the detected task. */
  switchedToModelId?: string;
  /** Missing model — UI should open Get filtered by collection. */
  needsModel?: OrchestratorNeedModel;
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
): { modelId: string; warning?: string; switched?: boolean } {
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
      capability === 'translation' ||
      capability === 'coding' ||
      capability === 'reasoning'
    ) {
      if (!caps.length || caps.includes('chat') || caps.includes(capability)) {
        return { modelId: preferredModelId };
      }
    }
    if (caps.includes(capability)) {
      return { modelId: preferredModelId };
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
      warning: `Switched to ${match.localName} for ${capabilityLabel(capability)}.`,
      switched: true,
    };
  }

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
    if (chat) {
      return {
        modelId: chat.listingId,
        warning:
          chat.listingId !== preferredModelId
            ? `Using ${chat.localName} for this task.`
            : undefined,
        switched: chat.listingId !== preferredModelId,
      };
    }
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

function needModelResult(
  resolution: CapabilityResolution,
  capability: ModelCapability,
  extra?: string,
): OrchestratorSendResult {
  const collection = capabilityToCollection(capability);
  const label = capabilityLabel(capability);
  return {
    text: [
      extra,
      `No ${label} model is installed yet.`,
      `Open Get → ${label} to browse free Hugging Face models and download one. PocketBrain will use it automatically next time.`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    resolution,
    needsModel: {
      capability,
      collection,
      message: `Download a ${label} model to continue.`,
    },
  };
}

/**
 * Central send pipeline: validate → resolve capability → gate → auto-switch → infer / create docs.
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
    const preferred = modelId?.trim() || '';
    const preferredOk =
      preferred.length > 0 && modelManager.get(preferred)?.status === 'installed';
    if (preferredOk) return null;

    const fallback = modelManager.list().find((m) => m.status === 'installed');
    if (fallback) {
      // Caller should have already remapped; allow send with any installed model.
      return null;
    }
    return 'No text model is installed. Download a Text model from Get to continue.';
  }

  /** Prefer `preferredId` when installed; otherwise first installed model. */
  resolveInstalledModelId(preferredId?: string): string | null {
    if (preferredId && modelManager.get(preferredId)?.status === 'installed') {
      return preferredId;
    }
    return modelManager.list().find((m) => m.status === 'installed')?.listingId ?? null;
  }

  async send(input: OrchestratorSendInput): Promise<OrchestratorSendResult> {
    const resolution = this.resolve(input.prompt, input.attachments);
    input.onStatus?.(resolution.label);

    if (resolution.limitationMessage && resolution.requestedTask === 'VIDEO_GENERATION') {
      return {
        text: resolution.limitationMessage,
        resolution,
        needsModel: {
          capability: 'system',
          collection: 'all',
          message: 'Video generation runtime is not available yet.',
        },
      };
    }

    if (resolution.requestedTask === 'IMAGE_GENERATION') {
      const gate = gateForCapability('image_generation');
      if (!gate.ready) {
        // Vision ≠ image generation. Be clear, then help with a text/SVG logo concept via chat.
        input.onStatus?.('Designing logo concept in text (no fake image)…');
        const chatPick = pickModelForCapability(input.modelId, 'chat');
        const modelId = chatPick.modelId;
        const attachmentBlock = formatAttachmentContext(input.attachments);
        const userAsk = input.prompt.trim() || 'Create a logo concept.';
        const designPrompt = [
          'User wants a logo / image. PocketBrain cannot paint pixels offline yet (no diffusion runtime).',
          'Do NOT pretend you output a PNG/JPG. Instead help with a practical design:',
          '1) Short logo concept (style, colors, symbols)',
          '2) 2–3 name-mark wordmark options',
          '3) A simple SVG snippet they can copy (viewBox 0 0 320 120, text + shapes)',
          '4) One-line tip: attach a photo later to a Vision model to critique a draft',
          '',
          `Request: ${userAsk}${attachmentBlock}`,
        ].join('\n');

        try {
          const historyPrompt = buildHistoryPrompt(input.history, designPrompt);
          const result = await aiService.generateText({
            modelId,
            prompt: historyPrompt,
            systemPrompt:
              'You are PocketBrain. Be honest: you cannot generate real images/photos offline. Deliver useful logo/text/SVG design help only.',
            gpuEnabled: input.gpuEnabled,
            nCtx: input.nCtx,
            signal: input.signal,
            onToken: input.onToken,
            rawPrompt: true,
          });
          const body = (result.text || '').trim();
          const preface = [
            '**Note:** A Vision model (like SmolVLM) *looks at* photos — it does **not** create new logos or pictures.',
            'Pixel image generation needs a separate diffusion runtime (not linked yet). Here is a text/SVG logo concept instead:',
            '',
          ].join('\n');
          return {
            text: body ? `${preface}${body}` : `${preface}Could not draft a concept. Try again with a chat model from Get.`,
            resolution,
            switchedToModelId: chatPick.switched ? modelId : undefined,
            cancelled: result.cancelled,
          };
        } catch (error) {
          throw new Error(humanModelError(error));
        }
      }
    }

    if (resolution.requestedTask === 'VISION') {
      const gate = gateForCapability('vision');
      if (!gate.ready) {
        return needModelResult(resolution, 'vision', 'No vision-capable model is installed.');
      }
      if (resolution.limitationMessage) {
        input.onStatus?.('Vision limited — using text context');
      }
    }

    const requiredCap =
      resolution.requiredCapability === 'system' ? 'chat' : resolution.requiredCapability;

    if (
      requiredCap === 'vision' ||
      requiredCap === 'coding' ||
      requiredCap === 'image_generation'
    ) {
      const gate = gateForCapability(requiredCap);
      if (!gate.ready) {
        return needModelResult(resolution, requiredCap);
      }
    }

    const { modelId, warning, switched } = pickModelForCapability(input.modelId, requiredCap);
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
          switchedToModelId: switched ? modelId : undefined,
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
        rawPrompt: true,
      });

      const text = (result.text || '').trim();
      if (result.cancelled) {
        return {
          text: text || 'Generation stopped.',
          resolution,
          cancelled: true,
          switchedToModelId: switched ? modelId : undefined,
        };
      }
      if (!text) {
        return {
          text: 'The model returned an empty response. Try rephrasing, using a larger max-tokens setting, or another model.',
          resolution,
          switchedToModelId: switched ? modelId : undefined,
        };
      }
      return {
        text: warning ? `${warning}\n\n${text}` : text,
        resolution,
        switchedToModelId: switched ? modelId : undefined,
      };
    } catch (error) {
      throw new Error(humanModelError(error));
    }
  }

  explainBlocked(message: string, goGet?: () => void): void {
    Alert.alert('Cannot send', message, [
      { text: 'OK', style: 'cancel' },
      ...(goGet ? [{ text: 'Open Get', onPress: goGet }] : []),
    ]);
  }
}

export const chatOrchestrator = new ChatOrchestrator();
