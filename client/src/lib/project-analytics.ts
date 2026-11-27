type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void | Promise<unknown>;
    };
  }
}

/** Replit injects the optional tracker; never install a second tracking script. */
export function trackProjectEvent(name: string, data: AnalyticsData): void {
  if (typeof window === "undefined") return;
  try {
    const result = window.umami?.track(name, data);
    // A rejected network request must be as harmless as an absent tracker.
    if (result) void Promise.resolve(result).catch(() => {});
  } catch {
    // Analytics must never interrupt browsing or navigation.
  }
}
