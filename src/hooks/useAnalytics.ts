import { useCallback } from 'react';
import { event, pageview, GTagEvent } from '../lib/analytics';
import { useAnalyticsStore } from '../store/useAnalyticsStore';

export function useAnalytics() {
  const { hasConsent, isInitialized, setConsent } = useAnalyticsStore();

  const trackEvent = useCallback(
    ({ action, category, label, value }: GTagEvent) => {
      if (hasConsent && isInitialized) {
        event({ action, category, label, value });
      }
    },
    [hasConsent, isInitialized]
  );

  const trackPageview = useCallback(
    (url: string) => {
      if (hasConsent && isInitialized) {
        pageview(url);
      }
    },
    [hasConsent, isInitialized]
  );

  return {
    trackEvent,
    trackPageview,
    hasConsent,
    setConsent,
    isInitialized,
  };
}
