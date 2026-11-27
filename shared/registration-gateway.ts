// Portable protocol shared by the Cloudflare Worker and the Node origin.
// No credentials or deployment defaults belong in this module.
export const gatewayHeaderPrefix = "x-planwise-gateway-";
export const gatewayHeaders = {
  version: `${gatewayHeaderPrefix}version`,
  audience: `${gatewayHeaderPrefix}audience`,
  country: `${gatewayHeaderPrefix}country`,
  timestamp: `${gatewayHeaderPrefix}timestamp`,
  nonce: `${gatewayHeaderPrefix}nonce`,
  signature: `${gatewayHeaderPrefix}signature`,
} as const;
export const gatewayMaxAgeSeconds = 90;
export const gatewayFutureSkewSeconds = 15;
export const registrationBodyLimit = 64 * 1024;
export const regionRestrictedMessage =
  "New accounts and free trials are not currently available in your region. Existing members can still sign in.";
export const locationUnavailableMessage =
  "We couldn't verify your location. Please try again later or contact dave@planwiseesl.com for help.";

export function isRegistrationRequest(method: string, pathname: string): boolean {
  return method.toUpperCase() === "POST" && /^\/api\/register\/?$/i.test(pathname);
}

export function isKnownCountry(country: string): boolean {
  return /^[A-Z]{2}$/.test(country) && !["XX", "ZZ", "EU", "AP"].includes(country);
}

export function isRestrictedCountry(country: string): boolean {
  return country === "IN" || country === "BD";
}

export interface GatewayAttestation {
  audience: string;
  country: string;
  timestamp: string;
  nonce: string;
  method: string;
  target: string;
  bodyHash: string;
}

export function gatewaySigningMessage(value: GatewayAttestation): string {
  return JSON.stringify([
    "planwise-registration-v1", value.audience, value.country,
    value.timestamp, value.nonce, value.method, value.target, value.bodyHash,
  ]);
}

export function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signGatewayRequest(
  input: Omit<GatewayAttestation, "bodyHash">,
  body: Uint8Array,
  secret: string,
  cryptoApi: Crypto = globalThis.crypto,
): Promise<Record<string, string>> {
  const encoder = new TextEncoder();
  const bodyHash = hex(await cryptoApi.subtle.digest("SHA-256", body));
  const key = await cryptoApi.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = hex(await cryptoApi.subtle.sign(
    "HMAC", key, encoder.encode(gatewaySigningMessage({ ...input, bodyHash })),
  ));
  return {
    [gatewayHeaders.version]: "1",
    [gatewayHeaders.audience]: input.audience,
    [gatewayHeaders.country]: input.country,
    [gatewayHeaders.timestamp]: input.timestamp,
    [gatewayHeaders.nonce]: input.nonce,
    [gatewayHeaders.signature]: signature,
  };
}
