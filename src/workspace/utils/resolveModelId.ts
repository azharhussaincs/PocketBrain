import { modelManager } from '../../services/ModelManager';
import { getStarterModel } from '../../data/catalog';

/**
 * Resolve which catalog/listing model id to use for generation.
 * Prefer an explicit id, else first installed model, else the starter listing id.
 */
export function resolveInstalledOrStarterModelId(explicit?: string): string {
  if (explicit) return explicit;
  const installed = modelManager.list().find((m) => m.status === 'installed');
  return installed?.listingId ?? getStarterModel().id;
}
