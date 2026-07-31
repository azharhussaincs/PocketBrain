export type ModelCategory =
  | 'text'
  | 'vision'
  | 'image'
  | 'audio'
  | 'video'
  | 'embedding'
  | 'translation'
  | 'ocr'
  | 'code'
  | 'reasoning';

export type ModelFormat = 'gguf' | 'onnx' | 'mlx' | 'mediapipe' | 'mlc' | 'coreml';

export type RuntimeId =
  | 'llama.cpp'
  | 'onnx'
  | 'mlc'
  | 'mediapipe'
  | 'coreml'
  | 'nnapi'
  | 'mock'
  | 'system'
  | 'mlkit';

export type Quantization =
  | 'Q2_K'
  | 'Q3_K_M'
  | 'Q4_0'
  | 'Q4_K_M'
  | 'Q5_K_M'
  | 'Q6_K'
  | 'Q8_0'
  | 'F16'
  | 'F32'
  | 'unknown';

export type ModelCapability =
  | 'chat'
  | 'vision'
  | 'ocr'
  | 'speech'
  | 'tts'
  | 'image_generation'
  | 'embeddings'
  | 'translation'
  | 'coding'
  | 'reasoning'
  | 'documents';

export type MediaModality = 'text' | 'image' | 'audio' | 'video';

export interface ModelListing {
  id: string;
  name: string;
  version?: string;
  description: string;
  author: string;
  license: string;
  category: ModelCategory;
  format: ModelFormat;
  preferredRuntime: RuntimeId;
  downloadUrl: string;
  downloadSizeBytes: number;
  requiredRamBytes: number;
  requiredStorageBytes: number;
  quantization: Quantization;
  parameterCount: string;
  supportedPlatforms: Array<'ios' | 'android'>;
  offlineCapable: boolean;
  sha256?: string;
  tags: string[];
  screenshotUrl?: string;
  benchmarkTokensPerSec?: number;
  isStarter?: boolean;
  capabilities?: ModelCapability[];
  inputTypes?: MediaModality[];
  outputTypes?: MediaModality[];
  hardwareAcceleration?: Array<'cpu' | 'gpu' | 'npu' | 'neural_engine'>;
  architectures?: string[];
}

export type InstallStatus = 'not_installed' | 'downloading' | 'paused' | 'installed' | 'error';

export interface InstalledModel {
  listingId: string;
  localName: string;
  filePath: string;
  installedAt: number;
  lastUsedAt?: number;
  sizeBytes: number;
  status: InstallStatus;
  sha256Verified?: boolean;
  usageCount?: number;
  favorite?: boolean;
}

export type DownloadState =
  | 'queued'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error'
  | 'verifying';

export interface DownloadJob {
  id: string;
  modelId: string;
  modelName: string;
  url: string;
  destinationPath: string;
  state: DownloadState;
  bytesWritten: number;
  totalBytes: number;
  startedAt: number;
  updatedAt: number;
  error?: string;
  expectedSha256?: string;
  pauseState?: unknown;
  wifiOnly: boolean;
}
