export type ThemeMode = 'system' | 'light' | 'dark';
export type PerformanceMode = 'balanced' | 'performance' | 'battery_saver';

export interface AppSettings {
  language: string;
  theme: ThemeMode;
  wifiOnlyDownloads: boolean;
  cpuThreads: number;
  gpuEnabled: boolean;
  memoryLimitMb: number;
  performanceMode: PerformanceMode;
  offlineMode: boolean;
  telemetryConsent: boolean;
  defaultContextSize: number;
  autoCheckModelUpdates: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'system',
  wifiOnlyDownloads: true,
  cpuThreads: 4,
  gpuEnabled: true,
  memoryLimitMb: 4096,
  performanceMode: 'balanced',
  offlineMode: false,
  telemetryConsent: false,
  defaultContextSize: 2048,
  autoCheckModelUpdates: true,
};
