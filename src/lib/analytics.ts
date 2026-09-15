import { GA_TRACKING_ID } from '../config/analytics';

// Extend the window object to include gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Log a pageview
export const pageview = (url: string) => {
  if (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    GA_TRACKING_ID
  ) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Log specific events
export interface GTagEvent {
  action: string;
  category: string;
  label: string;
  value?: number;
}

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    GA_TRACKING_ID
  ) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
