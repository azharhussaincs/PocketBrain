import { getListingById } from '../data/catalog';
import { modelRegistry } from '../ai/registry/ModelRegistry';
import type { ModelListing } from '../types/models';
import type { RegisteredModel } from '../ai/registry/types';
import type { AiTask } from './tasks';
import { formatBytes } from '../utils/format';

export type ModelBadge =
  | 'Beginner Friendly'
  | 'Fast'
  | 'High Quality'
  | 'Low RAM'
  | 'Recommended'
  | 'New'
  | 'Works Offline'
  | 'System'
  | 'Small'
  | 'Medium'
  | 'Large';

export type ModelSizeTier = 'small' | 'medium' | 'large';

export interface FriendlyModelCardData {
  id: string;
  friendlyName: string;
  purpose: string;
  downloadSizeLabel: string;
  ramLabel: string;
  offline: boolean;
  speed: 'Fast' | 'Balanced' | 'Slower';
  quality: 'Good' | 'Better' | 'Best';
  batteryImpact: 'Low' | 'Medium' | 'High';
  storageImpact: string;
  sizeTier: ModelSizeTier;
  badges: ModelBadge[];
  technicalName: string;
  author: string;
  license: string;
  quantization: string;
  runtime: string;
  installed: boolean;
  listing?: ModelListing;
  registered: RegisteredModel;
}

/** Size band for marketplace filters — based on download size. */
export function sizeTierForBytes(downloadBytes: number): ModelSizeTier {
  if (downloadBytes < 600_000_000) return 'small';
  if (downloadBytes < 2_800_000_000) return 'medium';
  return 'large';
}

function speedFor(listing?: ModelListing, registered?: RegisteredModel): FriendlyModelCardData['speed'] {
  const ram = listing?.requiredRamBytes ?? registered?.requiredRamBytes ?? 0;
  if (ram < 800_000_000) return 'Fast';
  if (ram < 2_500_000_000) return 'Balanced';
  return 'Slower';
}

function qualityFor(listing?: ModelListing): FriendlyModelCardData['quality'] {
  const params = listing?.parameterCount ?? '';
  if (/7B|8B|13B|70B/i.test(params)) return 'Best';
  if (/3B|3\.8B|4B|1B|360M/i.test(params)) return 'Better';
  return 'Good';
}

function batteryFor(speed: FriendlyModelCardData['speed']): FriendlyModelCardData['batteryImpact'] {
  if (speed === 'Fast') return 'Low';
  if (speed === 'Balanced') return 'Medium';
  return 'High';
}

function badgesFor(
  listing: ModelListing | undefined,
  registered: RegisteredModel,
  recommended: boolean,
  sizeTier: ModelSizeTier,
): ModelBadge[] {
  const badges: ModelBadge[] = [];
  if (sizeTier === 'small') badges.push('Small');
  else if (sizeTier === 'medium') badges.push('Medium');
  else badges.push('Large');
  if (registered.runtime === 'system' || registered.runtime === 'mlkit') badges.push('System');
  if (recommended) badges.push('Recommended');
  if (listing?.isStarter || (listing?.requiredRamBytes ?? 0) < 500_000_000) {
    badges.push('Beginner Friendly');
  }
  if ((listing?.requiredRamBytes ?? registered.requiredRamBytes) < 1_000_000_000) {
    badges.push('Low RAM');
  }
  if (speedFor(listing, registered) === 'Fast') badges.push('Fast');
  if (qualityFor(listing) === 'Best' || qualityFor(listing) === 'Better') {
    if (qualityFor(listing) === 'Best') badges.push('High Quality');
  }
  if (registered.offlineSupport) badges.push('Works Offline');
  if (listing?.tags.includes('vision') || listing?.category === 'vision') badges.push('New');
  return Array.from(new Set(badges));
}

export function toFriendlyCard(
  modelId: string,
  options?: { recommended?: boolean },
): FriendlyModelCardData | null {
  const registered = modelRegistry.get(modelId);
  if (!registered) return null;
  const listing = getListingById(modelId);
  const speed = speedFor(listing, registered);
  const sizeTier = sizeTierForBytes(
    listing?.downloadSizeBytes ?? registered.storageSizeBytes,
  );
  return {
    id: modelId,
    friendlyName: friendlyName(registered.name),
    purpose: registered.description.split('.')[0] + '.',
    downloadSizeLabel: formatBytes(registered.storageSizeBytes),
    ramLabel: formatBytes(registered.requiredRamBytes),
    offline: registered.offlineSupport,
    speed,
    quality: qualityFor(listing),
    batteryImpact: batteryFor(speed),
    storageImpact: formatBytes(registered.storageSizeBytes),
    sizeTier,
    badges: badgesFor(listing, registered, Boolean(options?.recommended), sizeTier),
    technicalName: registered.name,
    author: registered.author,
    license: registered.license,
    quantization: registered.quantization,
    runtime: registered.runtime,
    installed: registered.installed,
    listing,
    registered,
  };
}

function friendlyName(name: string): string {
  return name
    .replace(/\(Q4_K_M\)/gi, '')
    .replace(/Instruct/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function recommendationsForTask(task: AiTask): FriendlyModelCardData[] {
  const ids =
    task.recommendedModelIds.length > 0
      ? task.recommendedModelIds
      : modelRegistry
          .listByCapability(
            task.capability === 'system' ? 'chat' : task.capability,
            false,
          )
          .slice(0, 3)
          .map((m) => m.id);

  return ids
    .map((id, index) => toFriendlyCard(id, { recommended: index === 0 }))
    .filter((c): c is FriendlyModelCardData => c != null);
}

export type MarketplaceCollectionId =
  | 'all'
  | 'popular'
  | 'recommended'
  | 'beginner'
  | 'fast'
  | 'small'
  | 'medium'
  | 'large'
  | 'quality'
  | 'offline'
  | 'coding'
  | 'vision'
  | 'speech'
  | 'image'
  | 'translation'
  | 'ocr'
  | 'embeddings';

function allDownloadableCards(): FriendlyModelCardData[] {
  return modelRegistry
    .listAll()
    .filter((m) => m.runtime !== 'system' && m.runtime !== 'mlkit')
    .map((m) => toFriendlyCard(m.id))
    .filter((c): c is FriendlyModelCardData => c != null);
}

/**
 * Marketplace collections.
 * Purpose chips (coding, vision, …) keep capability filter but include every size.
 * Recommended / Popular / All show the full catalog (sorted by discovery).
 */
export function modelsInCollection(collection: MarketplaceCollectionId): FriendlyModelCardData[] {
  const all = allDownloadableCards();

  switch (collection) {
    case 'all':
    case 'popular':
    case 'recommended':
      return all;
    case 'beginner':
      // Still show full catalog; discovery sorts beginner-friendly first.
      return all;
    case 'fast':
      return all.filter((c) => c.speed === 'Fast' || c.sizeTier === 'small');
    case 'small':
      return all.filter((c) => c.sizeTier === 'small');
    case 'medium':
      return all.filter((c) => c.sizeTier === 'medium');
    case 'large':
      return all.filter((c) => c.sizeTier === 'large');
    case 'quality':
      return all.filter((c) => c.quality === 'Better' || c.quality === 'Best' || c.sizeTier !== 'small');
    case 'offline':
      return all.filter((c) => c.offline);
    case 'coding': {
      const coding = all.filter((c) => c.registered.capabilities.includes('coding'));
      // If few coding-tagged models, still surface full catalog so users see size choices.
      return coding.length > 0 ? coding : all;
    }
    case 'vision':
      return all.filter((c) => c.registered.capabilities.includes('vision'));
    case 'speech':
      return modelRegistry
        .listByCapability('speech', false)
        .map((m) => toFriendlyCard(m.id))
        .filter((c): c is FriendlyModelCardData => c != null);
    case 'image':
      return all.filter((c) => c.registered.capabilities.includes('image_generation'));
    case 'translation': {
      const tr = all.filter((c) => c.registered.capabilities.includes('translation'));
      return tr.length > 0 ? tr : all.filter((c) => c.listing?.tags.includes('multilingual') || c.registered.capabilities.includes('chat'));
    }
    case 'ocr':
      return modelRegistry
        .listByCapability('ocr', false)
        .map((m) => toFriendlyCard(m.id))
        .filter((c): c is FriendlyModelCardData => c != null);
    case 'embeddings':
      return all.filter((c) => c.registered.capabilities.includes('embeddings'));
    default:
      return all;
  }
}
