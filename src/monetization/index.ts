export interface MonetizationPlan {
  id: string;
  title: string;
  description: string;
}

/**
 * Future monetization seam — NO SDKs, NO ads, NO gating in Phase 4.
 * PocketBrain launches 100% free.
 */
export interface MonetizationService {
  isPremium(): Promise<boolean>;
  listPlans(): Promise<MonetizationPlan[]>;
  /** Reserved for a future paywall; must remain a no-op at launch. */
  unlock?(featureId: string): Promise<void>;
}

export interface SubscriptionProvider {
  getActiveSubscription(): Promise<{ productId: string } | null>;
}

export interface AdProvider {
  /** Must not show ads unless explicitly integrated in a future phase. */
  isEnabled(): boolean;
  showInterstitial?(): Promise<void>;
}

export class NoopMonetizationService implements MonetizationService {
  async isPremium(): Promise<boolean> {
    return true; // Everything unlocked at launch
  }

  async listPlans(): Promise<MonetizationPlan[]> {
    return [];
  }

  async unlock(): Promise<void> {
    // no-op
  }
}

export class NoopSubscriptionProvider implements SubscriptionProvider {
  async getActiveSubscription() {
    return null;
  }
}

export class NoopAdProvider implements AdProvider {
  isEnabled(): boolean {
    return false;
  }
}

export const monetizationService: MonetizationService = new NoopMonetizationService();
export const subscriptionProvider: SubscriptionProvider = new NoopSubscriptionProvider();
export const adProvider: AdProvider = new NoopAdProvider();
