import type { RequestHandler } from "express";
import { isIP } from "node:net";
import geoip from "geoip-country";
import proxyaddr from "proxy-addr";
import { restrictRegistrationGateway } from "./registration-gateway";

const restrictedCountries = new Set(["IN", "BD"]);
const isInternalProxy = proxyaddr.compile(["loopback", "linklocal", "uniquelocal"]);

/**
 * Walk backwards through internal proxy hops, stopping at the first public
 * address. A fixed one-hop req.ip can identify an internal proxy on Replit.
 * Never take the leftmost forwarded value: it may be caller-supplied.
 * Never accept a country from the request body, CF-IPCountry or X-Country:
 * those values can be supplied by the caller on our current hosting setup.
 * Lookup is local: visitor addresses are not sent to a geolocation service.
 */
export const restrictRegistrationCountry: RequestHandler = (req, res, next) => {
  const gatewayMode = process.env.REGISTRATION_GATEWAY_MODE || "off";
  if (gatewayMode === "enforce") {
    // A verified gateway country replaces local geolocation; never geolocate
    // the Cloudflare egress address or run both gates in sequence.
    return restrictRegistrationGateway(req, res, next);
  }
  if (gatewayMode !== "off") {
    res.status(503).json({ message: "Registration is temporarily unavailable. Please try again later." });
    return;
  }
  // Opt in only after real external visitor addresses have been verified on
  // the deployed host. Preview traffic may contain internal proxy hops only;
  // enabling a fail-closed check there would block every new signup.
  if (process.env.ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS !== "true") {
    next();
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");

  let country: string | undefined;
  let addressKind = "unavailable";
  try {
    const ip = proxyaddr(req, isInternalProxy);
    addressKind = isIP(ip) ? (isInternalProxy(ip, 0) ? "internal" : "public") : "invalid";
    country = ip && isIP(ip) ? geoip.lookup(ip)?.country : undefined;
  } catch {
    console.error("Registration country lookup failed");
  }

  if (!country || !/^[A-Z]{2}$/.test(country)) {
    // Don't silently grant a trial when the country cannot be verified.
    console.warn("Registration declined: visitor country could not be verified");
    if (process.env.NODE_ENV !== "production") {
      console.warn("Registration location diagnostics", {
        addressKind,
        forwardedHopCount: req.get("x-forwarded-for")?.split(",").length ?? 0,
        addressHeaderNames: Object.keys(req.headers).filter((name) => /ip|forward|country/.test(name)),
      });
    }
    res.setHeader("Retry-After", "300");
    res.status(503).json({
      code: "REGISTRATION_LOCATION_UNAVAILABLE",
      message: "We couldn't verify your location. Please try again later or contact dave@planwiseesl.com for help.",
    });
    return;
  }

  if (restrictedCountries.has(country)) {
    res.status(403).json({
      code: "REGISTRATION_REGION_RESTRICTED",
      message: "New accounts and free trials are not currently available in your region. Existing members can still sign in.",
    });
    return;
  }

  next();
};
