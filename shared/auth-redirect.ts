/**
 * Where to send someone after they sign in.
 *
 * A signed-out teacher who opens a page that needs an account (for example
 * /generate from an email, or /generate?topic=...&level=... from a student's
 * idea) is sent to /auth?redirect=<that page>, and comes back to it after
 * signing in or registering. Only paths on this site are accepted, so the
 * parameter can never send someone to another website.
 */

export const AUTH_REDIRECT_PARAM = 'redirect';
const DEFAULT_AFTER_SIGN_IN = '/dashboard';
const SITE = 'https://planwiseesl.com';

/** Returns a same-site path (with its query and hash) or null when the value is unsafe or pointless. */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || value.length > 2000) return null;
  // Must be a path on this site: "/x", never "//host", "/\host" or "https://host".
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value, SITE);
  } catch {
    return null;
  }
  if (url.origin !== SITE) return null;
  // Coming back to the sign-in page would loop.
  if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Where to go once signed in: the requested page if it is safe, otherwise the dashboard. */
export function afterSignInPath(search: string): string {
  const requested = new URLSearchParams(search).get(AUTH_REDIRECT_PARAM);
  return safeRedirectPath(requested) ?? DEFAULT_AFTER_SIGN_IN;
}

/** The sign-in address for someone who tried to open `pathWithQuery` while signed out. */
export function signInPathFor(pathWithQuery: string): string {
  const target = safeRedirectPath(pathWithQuery);
  if (!target || target === DEFAULT_AFTER_SIGN_IN) return '/auth';
  return `/auth?${AUTH_REDIRECT_PARAM}=${encodeURIComponent(target)}`;
}
