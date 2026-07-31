import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ConsentState {
  /** First-launch legal acceptance */
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedAiDisclaimer: boolean;
  onboardingCompleted: boolean;
  /** Feature consents */
  allowModelDownloads: boolean;
  allowMeteredNetworkDownloads: boolean;
  analyticsConsent: boolean;
  crashReportingConsent: boolean;
  /** Timestamps for auditability (local only) */
  termsAcceptedAt?: number;
  privacyAcceptedAt?: number;
  aiDisclaimerAcceptedAt?: number;
  /** Set during onboarding first-task picker; consumed once by Home */
  pendingFirstTaskId?: string | null;
  setConsent: <K extends keyof ConsentState>(
    key: K,
    value: ConsentState[K],
  ) => void;
  acceptAllRequired: () => void;
  resetConsents: () => void;
}

const defaults: Omit<ConsentState, 'setConsent' | 'acceptAllRequired' | 'resetConsents'> = {
  acceptedTerms: false,
  acceptedPrivacy: false,
  acceptedAiDisclaimer: false,
  onboardingCompleted: false,
  allowModelDownloads: false,
  allowMeteredNetworkDownloads: false,
  analyticsConsent: false,
  crashReportingConsent: false,
  pendingFirstTaskId: null,
};

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      ...defaults,
      setConsent: (key, value) => set({ [key]: value } as Partial<ConsentState>),
      acceptAllRequired: () =>
        set({
          acceptedTerms: true,
          acceptedPrivacy: true,
          acceptedAiDisclaimer: true,
          onboardingCompleted: true,
          allowModelDownloads: true,
          termsAcceptedAt: Date.now(),
          privacyAcceptedAt: Date.now(),
          aiDisclaimerAcceptedAt: Date.now(),
        }),
      resetConsents: () => set({ ...defaults }),
    }),
    {
      name: '@pocketbrain/consent',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
