import { Directory, File, Paths } from 'expo-file-system';
import { modelManager } from '../services/ModelManager';
import { storageService as workspaceStorage } from '../workspace/storage/StorageService';
import { getWorkspaceRoot } from '../workspace/storage/paths';
import { formatBytes } from '../utils/format';

export interface StorageBreakdown {
  modelsBytes: number;
  workspaceBytes: number;
  exportsBytes: number;
  generatedImagesBytes: number;
  cacheBytes: number;
  recoveryBytes: number;
  totalTrackedBytes: number;
  freeDiskBytes: number | null;
}

function dirSize(dir: Directory): number {
  if (!dir.exists) return 0;
  let total = 0;
  try {
    const children = dir.list();
    for (const child of children) {
      if (child instanceof Directory) {
        total += dirSize(child);
      } else if (child instanceof File) {
        total += child.size || 0;
      }
    }
  } catch {
    // ignore unreadable
  }
  return total;
}

export class AppStorageManager {
  getBreakdown(): StorageBreakdown {
    const modelsBytes = modelManager.totalStorageBytes();
    const workspaceBytes = workspaceStorage.totalStorageBytes();

    let exportsBytes = 0;
    let generatedImagesBytes = 0;
    let recoveryBytes = 0;
    let cacheBytes = 0;

    try {
      exportsBytes = dirSize(new Directory(getWorkspaceRoot(), 'exports'));
      recoveryBytes = dirSize(new Directory(getWorkspaceRoot(), 'recovery'));
    } catch {
      // ignore
    }
    try {
      generatedImagesBytes = dirSize(new Directory(Paths.document, 'generated-images'));
    } catch {
      // ignore
    }
    try {
      cacheBytes = dirSize(Paths.cache);
    } catch {
      // ignore
    }

    return {
      modelsBytes,
      workspaceBytes,
      exportsBytes,
      generatedImagesBytes,
      cacheBytes,
      recoveryBytes,
      totalTrackedBytes:
        modelsBytes +
        workspaceBytes +
        exportsBytes +
        generatedImagesBytes +
        cacheBytes +
        recoveryBytes,
      freeDiskBytes: workspaceStorage.freeDiskBytes(),
    };
  }

  clearCache(): number {
    const cache = Paths.cache;
    if (!cache.exists) return 0;
    let freed = 0;
    try {
      const children = cache.list();
      for (const child of children) {
        try {
          if (child instanceof File) {
            freed += child.size || 0;
            child.delete();
          } else if (child instanceof Directory) {
            freed += dirSize(child);
            child.delete();
          }
        } catch {
          // skip locked files
        }
      }
    } catch {
      // ignore
    }
    return freed;
  }

  clearRecoveryDrafts(): number {
    const dir = new Directory(getWorkspaceRoot(), 'recovery');
    if (!dir.exists) return 0;
    const freed = dirSize(dir);
    try {
      for (const child of dir.list()) {
        try {
          child.delete();
        } catch {
          // skip
        }
      }
    } catch {
      // ignore
    }
    return freed;
  }

  clearExportCache(): number {
    const dir = new Directory(getWorkspaceRoot(), 'exports');
    if (!dir.exists) return 0;
    const freed = dirSize(dir);
    try {
      for (const child of dir.list()) {
        try {
          child.delete();
        } catch {
          // skip
        }
      }
    } catch {
      // ignore
    }
    return freed;
  }

  recommendations(breakdown: StorageBreakdown): string[] {
    const tips: string[] = [];
    const unused = modelManager.unusedModels();
    if (unused.length) {
      const bytes = unused.reduce((s, m) => s + (m.sizeBytes || 0), 0);
      tips.push(
        `${unused.length} unused model(s) (~${formatBytes(bytes)}) — remove from Storage or My Models.`,
      );
    }
    if (breakdown.cacheBytes > 50_000_000) {
      tips.push('Clear cache to reclaim temporary download and media files.');
    }
    if (breakdown.exportsBytes > 30_000_000) {
      tips.push('Remove old export files you already shared.');
    }
    if (breakdown.recoveryBytes > 5_000_000) {
      tips.push('Clear recovery drafts if you no longer need unsaved backups.');
    }
    if (
      breakdown.freeDiskBytes != null &&
      breakdown.freeDiskBytes < 1_000_000_000
    ) {
      tips.push('Less than 1 GB free — remove unused models before downloading larger ones.');
    }
    if (!tips.length) {
      tips.push('Storage looks healthy. Remove unused models anytime from My Models.');
    }
    return tips;
  }
}

export const appStorageManager = new AppStorageManager();
