import type {
  ModelCapability,
  ModelCategory,
  ModelListing,
  Quantization,
} from '../types/models';
import { remoteListingStore } from './RemoteListingStore';

type HfSibling = { rfilename: string; size?: number };
type HfModel = {
  id: string;
  modelId?: string;
  author?: string;
  downloads?: number;
  likes?: number;
  tags?: string[];
  pipeline_tag?: string;
  siblings?: HfSibling[];
  cardData?: { license?: string };
};

export type HfSearchOptions = {
  query?: string;
  capability?: ModelCapability | 'all';
  limit?: number;
  /** Fetch full sibling lists for file sizes (slower, more accurate). */
  resolveFiles?: boolean;
};

const QUANT_PREF = [
  'Q4_K_M',
  'Q4_K_S',
  'Q5_K_M',
  'Q4_0',
  'Q3_K_M',
  'Q5_0',
  'Q6_K',
  'Q8_0',
  'IQ4_XS',
  'IQ3_M',
];

const CAPABILITY_QUERIES: Record<ModelCapability | 'all', string> = {
  all: 'GGUF',
  chat: 'instruct GGUF',
  documents: 'instruct GGUF',
  coding: 'coder GGUF',
  reasoning: 'reasoning GGUF',
  vision: 'VLM GGUF',
  translation: 'multilingual instruct GGUF',
  embeddings: 'embedding GGUF',
  speech: 'whisper GGUF',
  tts: 'TTS GGUF',
  ocr: 'OCR GGUF',
  image_generation: 'stable-diffusion GGUF',
};

function slugId(repoId: string, fileName: string): string {
  const base = `${repoId}__${fileName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `hf-${base}`.slice(0, 180);
}

function detectQuant(fileName: string): Quantization {
  const upper = fileName.toUpperCase();
  for (const q of QUANT_PREF) {
    if (upper.includes(q)) return q as Quantization;
  }
  if (upper.includes('F16')) return 'F16';
  if (upper.includes('F32')) return 'F32';
  return 'unknown';
}

function pickGgufFile(siblings: HfSibling[]): HfSibling | null {
  const ggufs = siblings.filter((s) => s.rfilename.toLowerCase().endsWith('.gguf'));
  if (!ggufs.length) return null;

  const scored = ggufs
    .filter((s) => !/mmproj|projector|encoder|clip/i.test(s.rfilename))
    .map((s) => {
      const upper = s.rfilename.toUpperCase();
      const qi = QUANT_PREF.findIndex((q) => upper.includes(q));
      const score = qi === -1 ? 50 : qi;
      // Prefer mid-size phone-friendly files when size known (~100MB–8GB).
      const size = s.size ?? 0;
      const sizePenalty =
        size > 0 && (size < 40_000_000 || size > 12_000_000_000) ? 20 : 0;
      return { s, score: score + sizePenalty };
    })
    .sort((a, b) => a.score - b.score);

  return (scored[0] ?? ggufs[0])?.s ?? null;
}

function inferCategory(repoId: string, tags: string[], pipeline?: string): ModelCategory {
  const hay = `${repoId} ${(tags ?? []).join(' ')} ${pipeline ?? ''}`.toLowerCase();
  if (/\b(vlm|vision|llava|moondream|minicpm-v|smolvlm|internvl|qwen2-vl|qwen2\.5-vl)\b/.test(hay)) {
    return 'vision';
  }
  if (/\b(coder|code)\b/.test(hay)) return 'code';
  if (/\b(embed|embedding|nomic|bge|e5)\b/.test(hay)) return 'embedding';
  if (/\b(whisper|asr|speech)\b/.test(hay)) return 'audio';
  if (/\b(diffusion|sdxl|flux|text-to-image)\b/.test(hay)) return 'image';
  if (/\b(reason|r1|thinking)\b/.test(hay)) return 'reasoning';
  return 'text';
}

function capabilitiesFor(category: ModelCategory, tags: string[]): ModelCapability[] {
  const hay = tags.join(' ').toLowerCase();
  switch (category) {
    case 'vision':
      return ['vision', 'chat'];
    case 'code':
      return ['coding', 'chat'];
    case 'embedding':
      return ['embeddings'];
    case 'audio':
      return hay.includes('tts') ? ['tts'] : ['speech'];
    case 'image':
      return ['image_generation'];
    case 'reasoning':
      return ['reasoning', 'chat'];
    case 'translation':
      return ['translation', 'chat'];
    default:
      return hay.includes('multilingual')
        ? ['chat', 'documents', 'translation']
        : ['chat', 'documents'];
  }
}

function estimateRam(downloadSizeBytes: number): number {
  // Rough offline GGUF working set ≈ file size + overhead.
  return Math.max(downloadSizeBytes * 1.35, 400_000_000);
}

function toListing(model: HfModel, file: HfSibling): ModelListing {
  const repoId = model.id || model.modelId || 'unknown';
  const [author] = repoId.split('/');
  const tags = model.tags ?? [];
  const category = inferCategory(repoId, tags, model.pipeline_tag);
  const size = file.size && file.size > 0 ? file.size : 500_000_000;
  const license =
    model.cardData?.license ||
    tags.find((t) => t.startsWith('license:'))?.replace('license:', '') ||
    'See model card';

  return {
    id: slugId(repoId, file.rfilename),
    name: `${repoId.split('/').pop()} (${detectQuant(file.rfilename)})`,
    description: `Free Hugging Face GGUF from ${repoId}. Download to use offline with llama.cpp when compatible.`,
    author: author || model.author || 'Hugging Face',
    license,
    category,
    format: 'gguf',
    preferredRuntime: 'llama.cpp',
    downloadUrl: `https://huggingface.co/${repoId}/resolve/main/${file.rfilename}`,
    downloadSizeBytes: size,
    requiredRamBytes: estimateRam(size),
    requiredStorageBytes: Math.round(size * 1.1),
    quantization: detectQuant(file.rfilename),
    parameterCount: 'see card',
    supportedPlatforms: ['ios', 'android'],
    offlineCapable: true,
    tags: ['huggingface', 'gguf', 'remote', ...tags.slice(0, 8)],
    capabilities: capabilitiesFor(category, tags),
    version: file.rfilename,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'PocketBrain/1.0 (offline AI; model discovery)',
    },
  });
  if (!res.ok) {
    throw new Error(`Hugging Face request failed (${res.status}). Try again on Wi‑Fi.`);
  }
  return (await res.json()) as T;
}

async function resolveSiblings(repoId: string): Promise<HfSibling[]> {
  try {
    const detail = await fetchJson<HfModel>(
      `https://huggingface.co/api/models/${encodeURIComponent(repoId)}?full=true`,
    );
    return detail.siblings ?? [];
  } catch {
    return [];
  }
}

/**
 * Browse free Hugging Face GGUF models (no size/model hard cap in UI —
 * network page size is bounded for responsiveness).
 */
export class HuggingFaceModelService {
  async search(options: HfSearchOptions = {}): Promise<ModelListing[]> {
    const limit = Math.min(Math.max(options.limit ?? 80, 10), 200);
    const capability = options.capability ?? 'all';
    const q =
      options.query?.trim() ||
      CAPABILITY_QUERIES[capability] ||
      'GGUF';

    const params = new URLSearchParams({
      search: q,
      filter: 'gguf',
      sort: 'downloads',
      direction: '-1',
      limit: String(limit),
      full: 'true',
    });

    const models = await fetchJson<HfModel[]>(
      `https://huggingface.co/api/models?${params.toString()}`,
    );

    const listings: ModelListing[] = [];
    for (const model of models) {
      const repoId = model.id || model.modelId;
      if (!repoId) continue;

      let siblings = model.siblings ?? [];
      if ((!siblings.length || options.resolveFiles) && options.resolveFiles !== false) {
        // List endpoint sometimes omits siblings — resolve a subset for accuracy.
        if (!siblings.some((s) => s.rfilename.toLowerCase().endsWith('.gguf'))) {
          siblings = await resolveSiblings(repoId);
        }
      }

      const file = pickGgufFile(siblings);
      if (!file) continue;

      // Skip clearly non-runnable / huge projector-only picks already filtered.
      const listing = toListing(model, file);

      // Image / video generative packages are listed for discovery honesty, but
      // PocketBrain will still gate generation until a runtime is linked.
      if (capability !== 'all' && capability !== 'image_generation') {
        if (!listing.capabilities?.includes(capability) && capability !== 'documents') {
          // Keep broad chat/search results even if tag inference is imperfect.
          if (capability === 'vision' && listing.category !== 'vision') continue;
          if (capability === 'coding' && listing.category !== 'code') continue;
          if (capability === 'embeddings' && listing.category !== 'embedding') continue;
        }
      }

      listings.push(listing);
    }

    await remoteListingStore.upsertMany(listings);
    return listings;
  }

  /** Popular free GGUF pack for first open / All category. */
  async browsePopular(limit = 100): Promise<ModelListing[]> {
    return this.search({ query: 'GGUF', limit, capability: 'all' });
  }

  async browseForCapability(
    capability: ModelCapability,
    limit = 80,
  ): Promise<ModelListing[]> {
    return this.search({ capability, limit });
  }
}

export const huggingFaceModelService = new HuggingFaceModelService();
