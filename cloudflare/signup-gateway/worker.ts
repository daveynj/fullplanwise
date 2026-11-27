import {
  gatewayHeaderPrefix, isKnownCountry, isRegistrationRequest, isRestrictedCountry,
  locationUnavailableMessage, regionRestrictedMessage, registrationBodyLimit, signGatewayRequest,
} from "../../shared/registration-gateway";

export interface GatewayEnvironment {
  ORIGIN_HOSTNAME: string;
  PUBLIC_HOSTS: string;
  GATEWAY_AUDIENCE: string;
  REGISTRATION_GATEWAY_SECRET: string;
}
export type CountryRequest = Request & { cf?: { country?: string | null } };
type OriginFetch = (request: Request, init?: RequestInit) => Promise<Response>;

function failure(status: number, code: string, message: string): Response {
  return Response.json({ code, message }, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      ...(status === 503 ? { "Retry-After": "300" } : {}),
    },
  });
}

async function readRegistrationBody(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > registrationBodyLimit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}

export async function handleGatewayRequest(
  request: CountryRequest,
  env: GatewayEnvironment,
  originFetch: OriginFetch = fetch,
): Promise<Response> {
  const publicUrl = new URL(request.url);
  const publicHosts = (env.PUBLIC_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  // Fixed operator-configured origin, never a URL/path supplied by the caller.
  if (!/^[a-z0-9-]+\.replit\.app$/i.test(env.ORIGIN_HOSTNAME || "") ||
      !publicHosts.includes(publicUrl.hostname.toLowerCase())) {
    return failure(503, "GATEWAY_NOT_CONFIGURED", "The service is temporarily unavailable. Please try again later.");
  }

  const originUrl = new URL(`https://${env.ORIGIN_HOSTNAME}`);
  originUrl.pathname = publicUrl.pathname;
  originUrl.search = publicUrl.search;
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name.startsWith(gatewayHeaderPrefix) ||
        ["host", "x-forwarded-for", "x-real-ip", "x-forwarded-host", "cf-ipcountry", "cf-connecting-ip"].includes(name)) {
      headers.delete(name);
    }
  }
  headers.set("x-forwarded-proto", "https");

  let body: Uint8Array | null | undefined;
  if (isRegistrationRequest(request.method, publicUrl.pathname)) {
    // A missing signing credential must not take down public browsing,
    // existing-member login or webhook delivery.
    if (!/^[a-z0-9_-]{3,80}$/i.test(env.GATEWAY_AUDIENCE || "") ||
        (env.REGISTRATION_GATEWAY_SECRET || "").length < 32) {
      return failure(503, "GATEWAY_NOT_CONFIGURED", locationUnavailableMessage);
    }
    const country = request.cf?.country || "";
    if (!isKnownCountry(country)) {
      return failure(503, "REGISTRATION_LOCATION_UNAVAILABLE", locationUnavailableMessage);
    }
    if (isRestrictedCountry(country)) {
      return failure(403, "REGISTRATION_REGION_RESTRICTED", regionRestrictedMessage);
    }
    body = await readRegistrationBody(request);
    if (body === null) return failure(413, "REGISTRATION_BODY_TOO_LARGE", "Your signup request is too large.");
    const attestation = await signGatewayRequest({
      audience: env.GATEWAY_AUDIENCE,
      country,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      nonce: crypto.randomUUID(),
      method: request.method,
      target: `${originUrl.pathname}${originUrl.search}`,
    }, body, env.REGISTRATION_GATEWAY_SECRET);
    for (const [name, value] of Object.entries(attestation)) headers.set(name, value);
  }

  // Non-registration bodies (including Stripe webhook bytes) pass through
  // without JSON parsing. Manual redirects never forward credentials onward.
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method, headers, redirect: "manual", cache: "no-store",
  };
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = body !== undefined ? body : request.body;
    init.duplex = "half"; // Required by Node's local streaming test harness.
  }
  const forwarded = new Request(originUrl, init);
  try {
    const response = await originFetch(forwarded);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Cache-Control", "private, no-store");
    // Do not expose gateway attestations if an origin accidentally echoes them.
    for (const name of [...responseHeaders.keys()]) {
      if (name.startsWith(gatewayHeaderPrefix)) responseHeaders.delete(name);
    }
    const location = responseHeaders.get("Location");
    if (location) {
      const redirect = new URL(location, originUrl);
      if (redirect.origin === originUrl.origin) {
        redirect.protocol = publicUrl.protocol;
        redirect.host = publicUrl.host;
        responseHeaders.set("Location", redirect.toString());
      }
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
  } catch {
    return failure(502, "GATEWAY_ORIGIN_UNAVAILABLE", "The service is temporarily unavailable. Please try again later.");
  }
}

export default {
  fetch(request: CountryRequest, env: GatewayEnvironment): Promise<Response> {
    return handleGatewayRequest(request, env);
  },
};
