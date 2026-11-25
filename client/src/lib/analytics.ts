/**
 * Google Analytics 4 events (the gtag snippet is in client/index.html).
 * Uses GA4's recommended event names so conversions show up in standard
 * reports. Never throws and never sends personal details.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: GtagParams) => void;
  }
}

export function trackEvent(name: string, params: GtagParams = {}): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // Analytics must never break the page.
  }
}

/** A call-to-action click, with where on the page it was. */
export function trackCta(location: string, label: string): void {
  trackEvent('select_promotion', { creative_slot: location, promotion_name: label });
}
