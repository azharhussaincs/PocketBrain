import type { ModelCapability } from '../types/models';
import type { MarketplaceCollectionId } from './recommendations';

/** Maps a required model capability to the Get (Marketplace) collection chip. */
export function capabilityToCollection(
  capability: ModelCapability | 'system',
): MarketplaceCollectionId {
  switch (capability) {
    case 'vision':
      return 'vision';
    case 'image_generation':
      return 'image';
    case 'coding':
      return 'coding';
    case 'speech':
      return 'speech';
    case 'tts':
      return 'speech';
    case 'ocr':
      return 'ocr';
    case 'translation':
      return 'translation';
    case 'embeddings':
      return 'embeddings';
    case 'reasoning':
      return 'quality';
    case 'documents':
      return 'all';
    case 'chat':
    case 'system':
    default:
      return 'all';
  }
}

export function capabilityLabel(capability: ModelCapability | 'system'): string {
  switch (capability) {
    case 'image_generation':
      return 'Image generation';
    case 'vision':
      return 'Vision';
    case 'coding':
      return 'Coding';
    case 'speech':
      return 'Speech';
    case 'tts':
      return 'Voice';
    case 'ocr':
      return 'OCR';
    case 'translation':
      return 'Translation';
    case 'embeddings':
      return 'Embeddings';
    case 'reasoning':
      return 'Reasoning';
    case 'documents':
      return 'Documents';
    case 'chat':
      return 'Chat';
    default:
      return 'Models';
  }
}
