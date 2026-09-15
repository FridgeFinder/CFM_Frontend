import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalyticsState {
  isInitialized: boolean;
  hasConsent: boolean;
  setInitialized: (val: boolean) => void;
  setConsent: (consent: boolean) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      isInitialized: false,
      hasConsent: true, // Auto-consent by default unless GDPR required
      setInitialized: (val) => set({ isInitialized: val }),
      setConsent: (consent) => set({ hasConsent: consent }),
    }),
    {
      name: 'analytics-storage',
      partialize: (state) => ({ hasConsent: state.hasConsent }), // only persist consent
    }
  )
);
