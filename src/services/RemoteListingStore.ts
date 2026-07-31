import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModelListing } from '../types/models';

const STORAGE_KEY = '@pocketbrain/remote_listings_v1';

/**
 * Cache for Hugging Face (and other remote) model listings so downloads,
 * registry lookups, and auto-switch keep working after browse.
 */
class RemoteListingStore {
  private byId = new Map<string, ModelListing>();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.hydrate();
  }

  private async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as ModelListing[];
      for (const item of list) {
        if (item?.id && item?.downloadUrl) this.byId.set(item.id, item);
      }
    } catch {
      // ignore corrupt cache
    }
  }

  async whenReady() {
    await this.ready;
  }

  get(id: string): ModelListing | undefined {
    return this.byId.get(id);
  }

  list(): ModelListing[] {
    return Array.from(this.byId.values());
  }

  async upsertMany(listings: ModelListing[]) {
    await this.ready;
    let changed = false;
    for (const listing of listings) {
      if (!listing?.id || !listing.downloadUrl) continue;
      this.byId.set(listing.id, listing);
      changed = true;
    }
    if (changed) await this.persist();
  }

  async upsert(listing: ModelListing) {
    await this.upsertMany([listing]);
  }

  private async persist() {
    // Cap cache so storage stays bounded (newest upserts win via Map order rebuild).
    const all = this.list();
    const trimmed = all.length > 800 ? all.slice(all.length - 800) : all;
    if (trimmed.length !== all.length) {
      this.byId = new Map(trimmed.map((m) => [m.id, m]));
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

export const remoteListingStore = new RemoteListingStore();
