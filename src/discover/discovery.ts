import { modelManager } from '../services/ModelManager';
import { getListingById } from '../data/catalog';
import type { HardwareProfile } from '../types/hardware';
import type { FriendlyModelCardData } from './recommendations';
import { toFriendlyCard } from './recommendations';

export type DiscoverySort =
  | 'recommended'
  | 'size_asc'
  | 'size_desc'
  | 'ram_asc'
  | 'author'
  | 'license'
  | 'recent';

export interface DiscoveryFilters {
  query?: string;
  author?: string;
  license?: string;
  languageTag?: string;
  offlineOnly?: boolean;
  maxRamBytes?: number;
  maxSizeBytes?: number;
  fitsDevice?: boolean;
  sort?: DiscoverySort;
}

/**
 * Intelligent marketplace discovery — filter/sort by task-adjacent metadata.
 */
export function discoverModels(
  cards: FriendlyModelCardData[],
  filters: DiscoveryFilters,
  hardware?: HardwareProfile | null,
): FriendlyModelCardData[] {
  let list = [...cards];
  const q = filters.query?.trim().toLowerCase() ?? '';

  if (q) {
    list = list.filter((m) => {
      const hay = [
        m.friendlyName,
        m.purpose,
        m.technicalName,
        m.author,
        m.license,
        ...(m.listing?.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  if (filters.author) {
    const a = filters.author.toLowerCase();
    list = list.filter((m) => m.author.toLowerCase().includes(a));
  }

  if (filters.license) {
    const lic = filters.license.toLowerCase();
    list = list.filter((m) => m.license.toLowerCase().includes(lic));
  }

  if (filters.languageTag) {
    const tag = filters.languageTag.toLowerCase();
    list = list.filter((m) =>
      (m.listing?.tags ?? []).some((t) => t.toLowerCase().includes(tag)),
    );
  }

  if (filters.offlineOnly) {
    list = list.filter((m) => m.offline);
  }

  if (filters.maxRamBytes != null) {
    list = list.filter(
      (m) => (m.listing?.requiredRamBytes ?? m.registered.requiredRamBytes) <= filters.maxRamBytes!,
    );
  }

  if (filters.maxSizeBytes != null) {
    list = list.filter(
      (m) =>
        (m.listing?.downloadSizeBytes ?? m.registered.storageSizeBytes) <= filters.maxSizeBytes!,
    );
  }

  if (filters.fitsDevice && hardware?.recommendedMaxModelRamBytes != null) {
    const budget = hardware.recommendedMaxModelRamBytes;
    list = list.filter(
      (m) => (m.listing?.requiredRamBytes ?? m.registered.requiredRamBytes) <= budget,
    );
  }

  const sort = filters.sort ?? 'recommended';
  list.sort((a, b) => {
    switch (sort) {
      case 'size_asc':
        return (
          (a.listing?.downloadSizeBytes ?? 0) - (b.listing?.downloadSizeBytes ?? 0)
        );
      case 'size_desc':
        return (
          (b.listing?.downloadSizeBytes ?? 0) - (a.listing?.downloadSizeBytes ?? 0)
        );
      case 'ram_asc':
        return (
          (a.listing?.requiredRamBytes ?? 0) - (b.listing?.requiredRamBytes ?? 0)
        );
      case 'author':
        return a.author.localeCompare(b.author);
      case 'license':
        return a.license.localeCompare(b.license);
      case 'recent':
        return (b.listing?.version ?? '').localeCompare(a.listing?.version ?? '');
      case 'recommended':
      default: {
        const score = (c: FriendlyModelCardData) =>
          (c.badges.includes('Recommended') ? 4 : 0) +
          (c.badges.includes('Beginner Friendly') ? 2 : 0) +
          (c.listing?.isStarter ? 3 : 0) +
          (c.offline ? 1 : 0);
        return score(b) - score(a);
      }
    }
  });

  return list;
}

export function whyRecommended(card: FriendlyModelCardData): string {
  const reasons: string[] = [];
  if (card.listing?.isStarter) reasons.push('Starter-friendly first download');
  if (card.badges.includes('Beginner Friendly')) reasons.push('Easy for first-time users');
  if (card.speed === 'Fast') reasons.push('Fast on typical phones');
  if (card.badges.includes('Low RAM')) reasons.push('Lower RAM requirement');
  if (card.offline) reasons.push('Works offline after install');
  if (card.quality === 'Best' || card.quality === 'Better') {
    reasons.push('Higher response quality for its size');
  }
  if (!reasons.length) reasons.push('Compatible with PocketBrain local runtimes');
  return reasons.join(' · ');
}

export function installedUpdateCandidates() {
  return modelManager.listAvailableUpdates().map((item) => {
    const card = toFriendlyCard(item.listingId);
    const listing = getListingById(item.listingId);
    return {
      ...item,
      friendlyName: card?.friendlyName ?? item.localName,
      license: listing?.license,
      sizeLabel: card?.downloadSizeLabel,
      reason: card ? whyRecommended(card) : 'Catalog model update available',
    };
  });
}
