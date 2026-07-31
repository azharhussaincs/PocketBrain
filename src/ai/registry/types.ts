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

export interface RegisteredModel {
  id: string;
  name: string;
  version: string;
  author: string;
  license: string;
  capabilities: ModelCapability[];
  requiredRamBytes: number;
  storageSizeBytes: number;
  quantization: string;
  runtime: string;
  architectures: string[];
  inputTypes: MediaModality[];
  outputTypes: MediaModality[];
  offlineSupport: boolean;
  hardwareAcceleration: Array<'cpu' | 'gpu' | 'npu' | 'neural_engine'>;
  installed: boolean;
  filePath?: string;
  category: string;
  description: string;
}

export interface CompatibilityReport {
  ok: boolean;
  warnings: string[];
  blockers: string[];
}
