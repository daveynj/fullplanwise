/**
 * Google Analytics 4 events (the gtag snippet is in client/index.html).
 * Uses GA4's recommended event names so conversions show up in standard
 * reports. Never throws and never sends personal details.
 */
type GtagParams = Record<string, string | number | boolean | undefined>;
type GtagCallbackParams = GtagParams | { event_callback?: () => void; event_timeout?: number };

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: GtagCallbackParams & Record<string, unknown>) => void;
  }
}

export function trackEvent(name: string, params: GtagParams = {}): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // Analytics must never break the page.
  }
}

/**
 * Sends an event, then runs `next` once GA has sent it, or after `timeoutMs`
 * at the latest (when GA is blocked or slow). Use before leaving the page,
 * such as the redirect to Stripe, or the event is lost with the page.
 */
export function trackEventThen(name: string, params: GtagParams, next: () => void, timeoutMs = 800): void {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    next();
  };
  setTimeout(go, timeoutMs);
  try {
    if (!window.gtag) return go();
    window.gtag('event', name, { ...params, event_callback: go, event_timeout: timeoutMs });
  } catch {
    go();
  }
}

/** A call-to-action click, with where on the page it was. */
export function trackCta(location: string, label: string): void {
  trackEvent('select_promotion', { creative_slot: location, promotion_name: label });
}
