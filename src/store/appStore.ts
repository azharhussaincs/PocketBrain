import { create } from 'zustand';
import type { DownloadJob, InstalledModel } from '../types/models';
import type { HardwareProfile } from '../types/hardware';
import { downloadManager } from '../services/DownloadManager';
import { modelManager } from '../services/ModelManager';
import { detectHardware } from '../services/HardwareService';

interface AppState {
  hardware: HardwareProfile | null;
  installed: InstalledModel[];
  downloads: DownloadJob[];
  bootstrap: () => Promise<void>;
  refreshDownloads: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hardware: null,
  installed: [],
  downloads: [],
  bootstrap: async () => {
    await modelManager.whenReady();
    const hardware = await detectHardware();
    set({
      hardware,
      installed: modelManager.list(),
      downloads: downloadManager.getJobs(),
    });

    modelManager.subscribe((installed) => set({ installed }));
    downloadManager.subscribe(() => {
      set({ downloads: downloadManager.getJobs() });
    });
  },
  refreshDownloads: () => set({ downloads: downloadManager.getJobs() }),
}));
