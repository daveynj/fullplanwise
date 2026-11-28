/**
 * Server-side Google Analytics 4 events (Measurement Protocol).
 *
 * Sign-ups and purchases sent from the browser go missing when a teacher
 * uses an ad blocker or a privacy browser: GA recorded none of the four
 * sign-ups in November 2026. The server can report them reliably. It reads
 * the visitor's own first-party GA cookies, so the event joins the same
 * visitor and session, and GA keeps showing which channel the teacher came
 * from.
 *
 * Switched off until GA_API_SECRET is set (GA Admin → Data streams → the
 * planwiseesl.com stream → Measurement Protocol API secrets). It never throws
 * and never sends personal details: only GA's random visitor id and event
 * parameters.
 */

export const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || "G-ZEF2MFWWF6";

/** Response header telling the browser the server already sent this event, so it doesn't send it twice. */
export const SERVER_TRACKED_HEADER = "X-Analytics-Tracked";

const CLIENT_ID = /^\d{1,12}\.\d{1,12}$/;

function cookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/** GA's visitor id from the `_ga` cookie ("GA1.1.123456789.1732780000" → "123456789.1732780000"). */
export function gaClientId(cookieHeader: string | undefined): string | null {
  const raw = cookieValue(cookieHeader, "_ga");
  const id = raw?.split(".").slice(-2).join(".");
  return id && CLIENT_ID.test(id) ? id : null;
}

/**
 * The current GA session id from the `_ga_<stream>` cookie. Handles both the
 * older "GS1.1.1732780000.5.1…" and newer "GS2.1.s1732780000$o5$g1…" formats.
 */
export function gaSessionId(cookieHeader: string | undefined, measurementId = GA_MEASUREMENT_ID): string | null {
  const raw = cookieValue(cookieHeader, `_ga_${measurementId.replace(/^G-/, "")}`);
  if (!raw) return null;
  const newer = raw.match(/^GS2\.\d+\.s(\d{6,12})(?:\$|$)/);
  if (newer) return newer[1];
  const older = raw.match(/^GS1\.\d+\.(\d{6,12})\./);
  return older ? older[1] : null;
}

export type GaParams = Record<string, string | number | boolean>;

/**
 * Sends one event for the visitor whose cookies came with the request.
 * Resolves true only when GA accepted it; false when switched off, when there
 * is no GA cookie (for example the browser blocks GA), or on any error.
 */
export async function sendGaEvent(
  cookieHeader: string | undefined,
  name: string,
  params: GaParams = {},
  options: { apiSecret?: string; timeoutMs?: number } = {},
): Promise<boolean> {
  const apiSecret = options.apiSecret ?? process.env.GA_API_SECRET;
  const clientId = gaClientId(cookieHeader);
  if (!apiSecret || !clientId) return false;
  const sessionId = gaSessionId(cookieHeader);
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(GA_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(apiSecret)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        events: [{ name, params: { ...params, ...(sessionId ? { session_id: sessionId } : {}), engagement_time_msec: 1 } }],
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 3000),
    });
    return res.ok;
  } catch (error) {
    console.warn(`[GA] Could not send ${name}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/** Whether the server will try to send events for this request (switched on and the visitor has a GA cookie). */
export function canSendGaEvent(cookieHeader: string | undefined): boolean {
  return !!process.env.GA_API_SECRET && !!gaClientId(cookieHeader);
}
