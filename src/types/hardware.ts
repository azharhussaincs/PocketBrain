export interface HardwareProfile {
  platform: 'ios' | 'android' | 'web' | 'unknown';
  modelName: string | null;
  manufacturer: string | null;
  osVersion: string | null;
  androidApiLevel: number | null;
  totalRamBytes: number | null;
  freeStorageBytes: number | null;
  totalStorageBytes: number | null;
  cpuArchitectures: string[] | null;
  isDevice: boolean;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown';
  estimatedGpuAvailable: boolean;
  recommendedMaxModelRamBytes: number;
}
