import { siteFacts } from "../shared/site-facts";

/** Billing returns must not be derived from Host or forwarding headers.
 * A gateway changes the received Host to the independent origin; a client can
 * also forge forwarding headers on direct-origin requests.
 */
export function publicAppUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.REGISTRATION_GATEWAY_MODE === "enforce" && !env.PUBLIC_APP_URL) {
    throw new Error("PUBLIC_APP_URL must be configured before gateway enforcement");
  }
  const configured = env.PUBLIC_APP_URL || (
    env.NODE_ENV !== "production" && env.REPLIT_DEV_DOMAIN
      ? `https://${env.REPLIT_DEV_DOMAIN}`
      : siteFacts.url
  );
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PUBLIC_APP_URL must be an HTTPS origin without credentials, path, query or fragment");
  }
  return url.origin;
}
