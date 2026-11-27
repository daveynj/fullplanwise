import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Request, RequestHandler } from "express";
import {
  gatewayHeaders, gatewayMaxAgeSeconds, gatewayFutureSkewSeconds, gatewaySigningMessage,
  isKnownCountry, isRegistrationRequest, isRestrictedCountry, locationUnavailableMessage,
  regionRestrictedMessage, registrationBodyLimit,
} from "../shared/registration-gateway";

declare global {
  namespace Express {
    interface Request { registrationRawBody?: Buffer }
  }
}

// Attach to JSON AND form parsers. Signature binds the exact bytes received,
// not JSON.stringify(req.body), which would change whitespace and key ordering.
export function captureRegistrationBody(req: Request, _res: unknown, body: Buffer): void {
  if (isRegistrationRequest(req.method, req.url.split("?")[0])) {
    req.registrationRawBody = Buffer.from(body);
  }
}

export interface GatewayConfig {
  secret: string;
  audience: string;
}
export interface GatewayGuardDependencies {
  config: () => GatewayConfig;
  consumeNonce: (hash: string, expiresAt: Date) => Promise<boolean>;
  now: () => number;
}

export function createRegistrationGatewayGuard(deps: GatewayGuardDependencies): RequestHandler {
  return async (req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    const unavailable = () => {
      res.setHeader("Retry-After", "300");
      res.status(503).json({ code: "REGISTRATION_LOCATION_UNAVAILABLE", message: locationUnavailableMessage });
    };
    const invalid = () => res.status(403).json({
      code: "REGISTRATION_GATEWAY_REQUIRED",
      message: "Please sign up through planwiseesl.com. If the problem continues, contact dave@planwiseesl.com.",
    });
    try {
      const config = deps.config();
      if (config.secret.length < 32 || !/^[a-z0-9_-]{3,80}$/i.test(config.audience)) {
        unavailable();
        return;
      }
      const version = req.get(gatewayHeaders.version);
      const audience = req.get(gatewayHeaders.audience) || "";
      const country = req.get(gatewayHeaders.country) || "";
      const timestamp = req.get(gatewayHeaders.timestamp) || "";
      const nonce = req.get(gatewayHeaders.nonce) || "";
      const signature = req.get(gatewayHeaders.signature) || "";
      if (version !== "1" || audience !== config.audience ||
          !/^\d{10}$/.test(timestamp) || !/^[a-z0-9-]{32,64}$/i.test(nonce) ||
          !/^[0-9a-f]{64}$/.test(signature)) {
        invalid();
        return;
      }
      const now = Math.floor(deps.now() / 1000);
      const issued = Number(timestamp);
      if (issued < now - gatewayMaxAgeSeconds || issued > now + gatewayFutureSkewSeconds) {
        invalid();
        return;
      }
      // Parsers must have captured nonempty JSON/form requests; never fall
      // back to trusting an already-parsed/re-encoded body.
      const raw = req.registrationRawBody;
      if (!raw && (req.headers["transfer-encoding"] || Number(req.headers["content-length"] || 0) !== 0)) {
        invalid();
        return;
      }
      const body = raw ?? Buffer.alloc(0);
      if (body.length > registrationBodyLimit) {
        res.status(413).json({ code: "REGISTRATION_BODY_TOO_LARGE", message: "Your signup request is too large." });
        return;
      }
      const expected = createHmac("sha256", config.secret).update(gatewaySigningMessage({
        audience, country, timestamp, nonce,
        method: req.method,
        target: req.originalUrl,
        bodyHash: createHash("sha256").update(body).digest("hex"),
      })).digest();
      if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) {
        invalid();
        return;
      }
      if (!isKnownCountry(country)) { unavailable(); return; }
      if (isRestrictedCountry(country)) {
        res.status(403).json({ code: "REGISTRATION_REGION_RESTRICTED", message: regionRestrictedMessage });
        return;
      }
      const nonceHash = createHash("sha256").update(`${audience}:${nonce}`).digest("hex");
      if (!await deps.consumeNonce(nonceHash, new Date((issued + gatewayMaxAgeSeconds + 1) * 1000))) {
        invalid();
        return;
      }
      next();
    } catch {
      // Never log bodies, signatures, signing credentials, or visitor IPs.
      console.error("Registration gateway verification unavailable");
      unavailable();
    }
  };
}

export const restrictRegistrationGateway = createRegistrationGatewayGuard({
  config: () => ({
    secret: process.env.REGISTRATION_GATEWAY_SECRET || "",
    audience: process.env.REGISTRATION_GATEWAY_AUDIENCE || "",
  }),
  now: Date.now,
  consumeNonce: async (hash, expiresAt) => {
    const { consumeRegistrationNonce } = await import("./registration-gateway-nonces");
    return consumeRegistrationNonce(hash, expiresAt);
  },
});
