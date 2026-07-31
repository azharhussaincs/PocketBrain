import { useCallback, useEffect, useRef } from 'react';
import type { WorkspaceDocument } from '../types/document';
import { workspaceService } from '../services/WorkspaceService';

/**
 * Debounced recovery write + periodic versioned save.
 */
export function useAutosave(
  document: WorkspaceDocument | null,
  dirty: boolean,
  onSaved?: (doc: WorkspaceDocument) => void,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushRecovery = useCallback(() => {
    if (!document || !dirty) return;
    workspaceService.autosaveRecovery(document);
  }, [document, dirty]);

  useEffect(() => {
    if (!document || !dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flushRecovery, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [document, dirty, flushRecovery]);

  useEffect(() => {
    if (!document || !dirty) return;
    if (versionTimer.current) clearTimeout(versionTimer.current);
    versionTimer.current = setTimeout(async () => {
      const saved = await workspaceService.save(document, {
        createVersion: true,
        versionLabel: 'Autosave',
      });
      onSaved?.(saved);
    }, 12_000);
    return () => {
      if (versionTimer.current) clearTimeout(versionTimer.current);
    };
  }, [document, dirty, onSaved]);
}
