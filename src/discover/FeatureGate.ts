import { modelRegistry } from '../ai/registry/ModelRegistry';
import { recommendationsForTask, toFriendlyCard, type FriendlyModelCardData } from './recommendations';
import { AI_TASKS, getTaskById, type TaskId } from './tasks';
import type { ModelCapability } from '../types/models';

export type RecommendationTier = 'best' | 'fastest' | 'smallest' | 'beginner';

export interface FeatureModelGate {
  ready: boolean;
  capability: ModelCapability | 'system';
  message: string;
  recommendations: Array<FriendlyModelCardData & { tier: RecommendationTier }>;
}

const SYSTEM_CAPS: Array<ModelCapability | 'system'> = ['speech', 'tts', 'ocr', 'system'];

function tierCards(capability: ModelCapability): Array<FriendlyModelCardData & { tier: RecommendationTier }> {
  const available = modelRegistry
    .listByCapability(capability, false)
    .map((m) => toFriendlyCard(m.id))
    .filter((c): c is FriendlyModelCardData => c != null && c.listing != null);

  if (!available.length) return [];

  const byRam = [...available].sort(
    (a, b) => (a.listing?.requiredRamBytes ?? 0) - (b.listing?.requiredRamBytes ?? 0),
  );
  const byQuality = [...available].sort((a, b) => {
    const score = (q: FriendlyModelCardData['quality']) =>
      q === 'Best' ? 3 : q === 'Better' ? 2 : 1;
    return score(b.quality) - score(a.quality);
  });
  const bySpeed = [...available].sort((a, b) => {
    const score = (s: FriendlyModelCardData['speed']) =>
      s === 'Fast' ? 3 : s === 'Balanced' ? 2 : 1;
    return score(b.speed) - score(a.speed);
  });
  const beginner =
    available.find((c) => c.badges.includes('Beginner Friendly')) ?? byRam[0];

  const picks: Array<FriendlyModelCardData & { tier: RecommendationTier }> = [];
  const pushUnique = (tier: RecommendationTier, card?: FriendlyModelCardData) => {
    if (!card) return;
    if (picks.some((p) => p.id === card.id)) return;
    picks.push({ ...card, tier });
  };

  pushUnique('best', byQuality[0]);
  pushUnique('fastest', bySpeed[0]);
  pushUnique('smallest', byRam[0]);
  pushUnique('beginner', beginner);
  return picks;
}

export function gateForCapability(capability: ModelCapability | 'system'): FeatureModelGate {
  if (SYSTEM_CAPS.includes(capability)) {
    return {
      ready: true,
      capability,
      message: 'Uses an on-device system engine. No large model download required.',
      recommendations: [],
    };
  }

  const installed = modelRegistry.listByCapability(capability as ModelCapability, true);
  if (installed.length > 0) {
    return {
      ready: true,
      capability,
      message: 'Compatible model installed.',
      recommendations: [],
    };
  }

  const label =
    capability === 'image_generation'
      ? 'Image Generation'
      : capability.charAt(0).toUpperCase() + capability.slice(1).replace('_', ' ');

  return {
    ready: false,
    capability,
    message: `You don't have a ${label} model installed.`,
    recommendations: tierCards(capability as ModelCapability),
  };
}

export function gateForTask(taskId: TaskId): FeatureModelGate {
  const task = getTaskById(taskId);
  if (!task) {
    return {
      ready: false,
      capability: 'chat',
      message: 'Unknown task.',
      recommendations: [],
    };
  }
  if (task.experimental) {
    return {
      ready: false,
      capability: 'system',
      message: 'This experimental feature is not enabled yet.',
      recommendations: [],
    };
  }
  const gate = gateForCapability(task.capability);
  if (!gate.ready && !gate.recommendations.length) {
    const cards = recommendationsForTask(task).map((c, i) => ({
      ...c,
      tier: (i === 0 ? 'best' : i === 1 ? 'fastest' : 'smallest') as RecommendationTier,
    }));
    return { ...gate, recommendations: cards };
  }
  return gate;
}

export function gateForPlayMode(mode: string): FeatureModelGate {
  const map: Record<string, ModelCapability | 'system'> = {
    chat: 'chat',
    image: 'image_generation',
    vision: 'vision',
    ocr: 'ocr',
    speech: 'speech',
    voice: 'tts',
    translate: 'translation',
    code: 'coding',
    documents: 'documents',
    reasoning: 'reasoning',
  };
  return gateForCapability(map[mode] ?? 'chat');
}

export function defaultTaskForCapability(capability: ModelCapability): TaskId {
  const found = AI_TASKS.find((t) => t.capability === capability && !t.experimental);
  return found?.id ?? 'chat';
}
