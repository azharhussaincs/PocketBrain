import { MODEL_CATALOG, getListingById } from '../../data/catalog';
import { modelManager } from '../../services/ModelManager';
import { canInstallModel, detectHardware } from '../../services/HardwareService';
import type { HardwareProfile } from '../../types/hardware';
import type { ModelCapability, ModelListing } from '../../types/models';
import type { CompatibilityReport, RegisteredModel } from './types';

function defaultCapabilities(listing: ModelListing): ModelCapability[] {
  if (listing.capabilities?.length) return listing.capabilities;
  switch (listing.category) {
    case 'vision':
      return ['vision', 'chat'];
    case 'image':
      return ['image_generation'];
    case 'audio':
      return listing.tags.includes('tts') ? ['tts'] : ['speech'];
    case 'ocr':
      return ['ocr'];
    case 'embedding':
      return ['embeddings'];
    case 'translation':
      return ['translation', 'chat'];
    case 'code':
      return ['coding', 'chat'];
    case 'reasoning':
      return ['reasoning', 'chat'];
    default:
      return ['chat', 'documents'];
  }
}

function toRegistered(listing: ModelListing, installedPath?: string): RegisteredModel {
  return {
    id: listing.id,
    name: listing.name,
    version: listing.version ?? listing.parameterCount,
    author: listing.author,
    license: listing.license,
    capabilities: defaultCapabilities(listing),
    requiredRamBytes: listing.requiredRamBytes,
    storageSizeBytes: listing.downloadSizeBytes,
    quantization: listing.quantization,
    runtime: listing.preferredRuntime,
    architectures: listing.architectures ?? ['arm64-v8a', 'armeabi-v7a', 'arm64'],
    inputTypes: listing.inputTypes ?? (
      listing.category === 'vision' || listing.category === 'image' || listing.category === 'ocr'
        ? ['image', 'text']
        : listing.category === 'audio'
          ? ['audio', 'text']
          : ['text']
    ),
    outputTypes: listing.outputTypes ?? (
      listing.category === 'image'
        ? ['image']
        : listing.category === 'audio' && listing.tags.includes('tts')
          ? ['audio']
          : ['text']
    ),
    offlineSupport: listing.offlineCapable,
    hardwareAcceleration: listing.hardwareAcceleration ?? ['cpu', 'gpu'],
    installed: Boolean(installedPath),
    filePath: installedPath,
    category: listing.category,
    description: listing.description,
  };
}

/** Built-in system engines that do not require marketplace downloads. */
export const SYSTEM_ENGINES: RegisteredModel[] = [
  {
    id: 'system-tts',
    name: 'Device Text-to-Speech',
    version: 'system',
    author: 'OS',
    license: 'Device vendor',
    capabilities: ['tts'],
    requiredRamBytes: 0,
    storageSizeBytes: 0,
    quantization: 'n/a',
    runtime: 'system',
    architectures: ['any'],
    inputTypes: ['text'],
    outputTypes: ['audio'],
    offlineSupport: true,
    hardwareAcceleration: ['cpu'],
    installed: true,
    category: 'audio',
    description: 'Uses on-device system voices. No cloud upload.',
  },
  {
    id: 'system-stt',
    name: 'Device Speech Recognition',
    version: 'system',
    author: 'OS',
    license: 'Device vendor',
    capabilities: ['speech'],
    requiredRamBytes: 0,
    storageSizeBytes: 0,
    quantization: 'n/a',
    runtime: 'system',
    architectures: ['any'],
    inputTypes: ['audio'],
    outputTypes: ['text'],
    offlineSupport: true,
    hardwareAcceleration: ['cpu'],
    installed: true,
    category: 'audio',
    description:
      'Prefers on-device speech recognition when the OS language pack is installed. Microphone access is requested only when you start listening.',
  },
  {
    id: 'system-ocr',
    name: 'On-device OCR (ML Kit / Vision)',
    version: 'system',
    author: 'Google ML Kit / Apple Vision',
    license: 'Platform SDK terms',
    capabilities: ['ocr'],
    requiredRamBytes: 50_000_000,
    storageSizeBytes: 0,
    quantization: 'n/a',
    runtime: 'mlkit',
    architectures: ['any'],
    inputTypes: ['image'],
    outputTypes: ['text'],
    offlineSupport: true,
    hardwareAcceleration: ['cpu', 'gpu'],
    installed: true,
    category: 'ocr',
    description: 'On-device OCR. Requires a development build. No network request for recognition.',
  },
];

export class ModelRegistry {
  listAll(): RegisteredModel[] {
    const installed = new Map(
      modelManager
        .list()
        .filter((m) => m.status === 'installed')
        .map((m) => [m.listingId, m.filePath]),
    );

    const catalog = MODEL_CATALOG.map((listing) =>
      toRegistered(listing, installed.get(listing.id)),
    );
    return [...SYSTEM_ENGINES, ...catalog];
  }

  get(id: string): RegisteredModel | undefined {
    return this.listAll().find((m) => m.id === id);
  }

  listByCapability(capability: ModelCapability, installedOnly = false): RegisteredModel[] {
    return this.listAll().filter(
      (m) => m.capabilities.includes(capability) && (!installedOnly || m.installed),
    );
  }

  availableCapabilities(installedOnly = true): ModelCapability[] {
    const set = new Set<ModelCapability>();
    for (const model of this.listAll()) {
      if (installedOnly && !model.installed) continue;
      for (const cap of model.capabilities) set.add(cap);
    }
    return Array.from(set);
  }

  async checkCompatibility(
    listingId: string,
    hardware?: HardwareProfile | null,
  ): Promise<CompatibilityReport> {
    const listing = getListingById(listingId);
    const warnings: string[] = [];
    const blockers: string[] = [];

    if (!listing) {
      return { ok: false, warnings, blockers: ['Unknown model'] };
    }

    const hw = hardware ?? (await detectHardware());
    const basic = canInstallModel(listing, hw);
    blockers.push(...basic.reasons);

    if (hw.cpuArchitectures?.length && listing.architectures?.length) {
      const supported = hw.cpuArchitectures.some((arch) =>
        listing.architectures!.some((a) => arch.toLowerCase().includes(a.toLowerCase())),
      );
      if (!supported) {
        warnings.push(
          `CPU architecture ${hw.cpuArchitectures.join(', ')} may be unsupported for this build.`,
        );
      }
    }

    if (listing.requiredRamBytes > 4_000_000_000) {
      warnings.push('Large model — expect slower load times and higher battery use.');
    }

    if (listing.category === 'image' || listing.category === 'video') {
      warnings.push(
        'Generative media models need substantial RAM/GPU. Generation may fail on low-end devices.',
      );
    }

    if (!listing.offlineCapable) {
      blockers.push('This model is not offline-capable and is blocked by PocketBrain policy.');
    }

    return { ok: blockers.length === 0, warnings, blockers };
  }
}

export const modelRegistry = new ModelRegistry();
