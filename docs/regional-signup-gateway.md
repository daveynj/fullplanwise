# Regional signup gateway: staging and rollout

## Status and safety boundary

This is a **prepared, locally tested gateway**, not a live firewall. No Cloudflare
account, signing credential, staging hostname, DNS change, external deployment,
paid subscription, or production restriction has been created or activated.
External staging remains **unverified** until the owner supplies account access
through supported secure flows and approves the steps below.

Policy: block **new teacher accounts and their automatically started 14-day
trials** for India (`IN`) and Bangladesh (`BD`). Do not revoke existing accounts,
existing trials, or paid subscriptions. Public lessons and their images, the
library, private student pages, existing-member login, subscription management,
checkout, and Stripe webhooks must remain accessible under their existing access
rules. IP country is an estimate, not nationality; VPNs can bypass it.

**Default state:** leave `REGISTRATION_GATEWAY_MODE` unset or `off`, and leave
`ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS` unset or false. Publishing these code
changes alone does not enable the restriction.

## Prerequisites observed on 2026-11-27

- The deployment service identified the public custom domain as
  `https://planwiseesl.com` and its additional origin address as
  `https://Daves-lesson-gen.replit.app`. The origin answered HTTP 200 directly
  during investigation. Reconfirm both with the deployment service immediately
  before staging/cutover; do not reconstruct origin URLs from environment values.
- Nameservers resolved to `ns1.livedns.co.uk`, `ns2.livedns.co.uk`, and
  `ns3.livedns.co.uk`, not Cloudflare.
- A public DNS DS lookup returned no delegation-signing records. This is only
  an observation, not confirmation of the registrar's DNSSEC setting: check the
  registrar directly before changing nameservers.
- **A complete owner-provided DNS export is still required.** Public DNS lookups
  cannot enumerate all records or replace a zone export.
- Preview/browser requests exposed internal proxy addresses, not reliable public
  visitor locations. Do not enable the older local-IP restriction on that evidence.
- Replit says ordinary Cloudflare-proxied custom-domain records can prevent
  automatic certificate provisioning/renewal. Do not just toggle the current
  Replit records to orange-cloud proxy mode.

## Architecture

Browser → Cloudflare Worker custom domain → fixed HTTPS Replit-hosted origin.

Cloudflare terminates TLS for the public Worker domain. The Worker makes a
separate HTTPS request to the confirmed `.replit.app` origin, which retains its
independent certificate. This is different from orange-cloud proxying Replit's
existing custom-domain A record. Treat this as a candidate architecture requiring
actual staged TLS/session verification, not a guarantee about either provider.

Only registration is region-restricted. The Worker uses `request.cf.country`,
not a country header supplied by the visitor. Eligible registration requests carry
an HMAC attestation bound to method, exact path/query, raw body bytes, environment
audience, timestamp and a unique nonce. The origin validates that attestation
before account creation, hashing passwords or enrolling anyone in Mailchimp.

The origin accepts attestations at most 90 seconds old and at most 15 seconds
in the future. A shared Postgres table consumes a hashed nonce once across
autoscale instances. It stores neither visitor IPs nor signup bodies.
Storage failure fails only new registrations closed; never bypass replay
protection with an in-memory cache. The table is created lazily on the first
valid eligible request in enforcement mode; that requires CREATE/INSERT/DELETE
permissions and must be checked on the isolated staging database first.

Country missing, `XX`, `ZZ`, aggregate-region or Tor-style metadata: signup
returns a temporary-unavailability response, not a trial. Blocked countries get
a clear region-restriction response. Missing/forged origin attestations are
rejected in enforcement mode. Public browsing and existing accounts are not
subject to any of these decisions.

Requests to registration routes accepted by Express, including case and trailing
slash variants, are covered. Non-registration request bodies stream unchanged,
including Stripe webhook bodies and signature headers. The Worker does not follow
origin redirects and does not cache responses. Origin-host redirects are rewritten
to the public hostname; external Stripe redirects remain external.

## Configuration

The checked-in Worker configuration intentionally has **no routes, custom domains
or origin**, with `workers_dev` and preview URLs disabled. Do not attach it to a
production hostname while those values are empty.

| Setting | Where | Value to choose after approval |
| --- | --- | --- |
| `ORIGIN_HOSTNAME` | Worker variable | Confirmed independent origin hostname, with no scheme or path; only a single `.replit.app` hostname is allowed |
| `PUBLIC_HOSTS` | Worker variable | Comma-separated exact hostnames approved for that deployment; no wildcards |
| `GATEWAY_AUDIENCE` | Worker variable | Distinct staging/production label, such as `planwise-staging` |
| `REGISTRATION_GATEWAY_SECRET` | Worker secret and Replit secret | Same cryptographically random signing value of at least 32 characters for that environment |
| `REGISTRATION_GATEWAY_AUDIENCE` | Replit variable | Must exactly match the Worker's audience |
| `REGISTRATION_GATEWAY_MODE` | Replit variable | `off` by default; `enforce` only after all approval gates pass |
| `PUBLIC_APP_URL` | Replit variable | Exact public HTTPS origin for this environment, without path/query; mandatory in gateway mode so Stripe returns to the public session-cookie host |
| `ENABLE_REGISTRATION_COUNTRY_RESTRICTIONS` | Replit variable | Keep unset/false; gateway mode must not geolocate Cloudflare's egress IP |

Use a different signing credential and audience for staging and production.
Set `PUBLIC_APP_URL` to the staging gateway origin in staging and the approved
public site origin in production. Checkout URLs are never constructed from the
received Host or forwarding headers: the gateway changes that Host to the
independent origin. A missing/invalid public URL in gateway mode prevents checkout
before any customer or payment session is created. Outside gateway mode the normal
production canonical URL or configured development domain is used.
Configure credentials only through supported Replit secret forms and Cloudflare
Worker secrets, not chat, source files, browser code, shell output or log messages.
Do not copy the synthetic credentials used in unit tests.

For rotation, keep origin enforcement off during a controlled, explicitly approved
rotation window, replace the credential on both sides, verify the gateway, then
restore enforcement. Dual-key seamless rotation is not implemented.

The Worker uses no additional runtime packages. For deployment, the owner needs a
compatible Cloudflare Wrangler toolchain or the Cloudflare dashboard; neither is
installed or authenticated by this change. Use a pinned, supported Wrangler version
after checking its current documentation. The repository has no deploy-on-merge
or automatic nameserver change.

## Stage 1 — approvals and records, without live changes

1. Obtain owner approval for a Cloudflare account/zone, its terms and any cost.
   Workers currently has a 100,000-request/day free allowance; paid Workers starts
   at $5/month with usage-based overages. Recheck current pricing. An uncached
   whole-site gateway counts page, API, and asset requests; do not assume the free
   limit is enough or that exhaustion can safely fail open.
2. Obtain an owner-provided complete DNS zone export and registrar screenshot or
   record of the nameservers, TTLs, and DNSSEC/DS settings. Keep private exports in
   access-controlled storage, not the public repository.
3. Inventory every A/AAAA/CNAME/TXT/MX/SRV/CAA record, including SPF, all DKIM
   selectors, DMARC, email verification and service records. Preserve every
   unrelated record exactly and identify all apex/www redirects. Do not combine
   an email-provider change with this migration.
4. Confirm the actual Stripe webhook destinations and their signing configuration
   read-only. Do not call webhook-registration tools or change endpoints for testing.
   Development shares live billing configuration; never trigger a real charge.
5. Have the owner approve a separate staging hostname and isolated staging origin.
   Use a separate database, non-production/test billing and disabled or sandboxed
   outbound email. Do not point a public signup test at the production database.
   Creating another deployment or publishing requires separate owner approval.

Approval gate: no infrastructure changes until account access, record preservation,
staging isolation, pricing/limits, and rollback ownership are agreed.

## Stage 2 — isolated staging

1. Run local checks:
   ```
   npm run check
   npm run check:gateway
   npx vitest run server/registration-gateway.test.ts server/registration-gateway-nonces.test.ts server/registration-country.test.ts server/registration-country-auth.test.ts server/public-app-url.test.ts server/subscription-checkout-gateway.test.ts server/subscription-checkout-route.test.ts server/subscription-checkout.test.ts client/src/lib/registration-error.test.ts
   npm run build
   ```
   Tests use fake providers/transport and do not create real accounts or send
   email. Gateway tests simulate trusted country metadata; they do not prove
   Cloudflare is configured correctly.
2. Deploy the Worker only to the approved staging hostname/origin with separate
   staging credentials. Configure exact public hosts and audience. If staging uses
   a temporary `workers.dev` URL, explicitly allow that hostname and enable it only
   in staging; the default configuration does not expose one.
3. Deploy the prepared app to the isolated origin with enforcement initially off.
   Configure the matching signing secret/audience and staging public URL using the supported configuration flows; ensure
   the nonce table can be created/used by the staging database role.
4. With approval, enable enforcement **only on the isolated staging origin**.
   Confirm the trusted Cloudflare country signal exists through actual external
   requests. Do not infer this from a spoofed `CF-IPCountry` header, the Worker
   dashboard preview, or Replit internal preview requests.
5. Verify exactly once through the completed staged setup:
   - IN and BD registration attempts get the regional message and create no user,
     trial, session or Mailchimp enrollment.
   - Eligible-country signup gets the existing 14-day trial and a functioning
     session. Existing users can sign in from IN/BD without any gateway signature
     on their login request.
   - Direct `.replit.app` signup, forged headers, changed bodies/queries,
     expired attestations, concurrent replay and unknown countries cannot issue trials.
   - GET public library and individual lessons, original share URLs, images, metadata,
     private student pages and existing permissions are unchanged. Do not expose
     teacher prompts, teacher notes or private lesson content as part of testing.
   - Test-member subscription-management links and redirects work without creating
     a live subscription. Stripe test/synthetic webhook bytes and signatures survive
     the gateway; do not re-register a live webhook or modify its destination.
   - Inspect the checkout-session parameters sent to the mocked/test merchant:
     success and cancellation URLs must use the staging public gateway hostname,
     not the independent origin or an incoming forwarding header. Follow a test
     checkout return and confirm the existing public-domain session remains signed in.
   - Session cookies retain host scope, HttpOnly/Secure/SameSite behavior and expiry;
     both set-cookie headers survive when an origin sends multiple cookies.
   - Origin redirects retain the public domain and query string; Stripe redirects
     stay external. JSON errors are readable; upstream outages do not leak credentials.
6. Record results, staging URLs, quota checks and explicit owner sign-off. If
   credentials or external staging are unavailable, record that as **unverified**
   and stop; local test success is not permission to activate.

## Stage 3 — explicit live cutover approval

1. Schedule a low-traffic window and name the person who can revert DNS and the
   person who can change Replit variables/publish. Back up current settings.
2. After final approval, copy the complete zone to Cloudflare and compare every
   record with the owner's export. Resolve DNSSEC with the registrar before a
   nameserver change; stale DS records can make the whole domain unreachable.
   Re-enable DNSSEC only after the new delegation is healthy.
3. Prepare production credentials, exact production public hosts/audience, and
   the production `PUBLIC_APP_URL` matching the approved public cookie hostname.
   Keep origin enforcement **off** during publishing and routing changes.
   The owner must perform publishing; code changes alone do not change the live app.
4. Route the approved apex and www hostnames deliberately. Worker custom domains
   are exact-host matches, so www must have its own validated gateway route or a
   validated redirect preserving path/query. Arrange the Worker certificate before
   sending traffic to it. Do not orange-cloud the existing Replit A record as a shortcut.
5. Keep the independently working `.replit.app` origin available and validate its
   TLS independently. Preserve the old Replit custom-domain configuration during
   the initial rollback window where possible; do not delete an old binding as
   an unreviewed cleanup.
6. While enforcement is off, verify public pages, account sessions, live email
   delivery/DNS, billing portal opening and normal webhook delivery without
   charging a card. Confirm the new Worker traffic is reaching the correct origin,
   that origin redirects stay on the public domain, and that country metadata is
   present. A direct-origin signup remains temporarily possible in this phase:
   that is a disclosed rollback/transition window, not an active firewall.
7. With another explicit owner approval, set production mode to `enforce`.
   Verify eligible requests through the gateway and rejection of direct-origin
   signup before announcing that protection is active. Confirm old local-IP mode
   is still disabled.

## Monitor and rollback

- Monitor registration success, 403 regional denials, 403 gateway-required denials,
  503 unknown-country/config/replay-store failures, gateway 502s, Worker usage/quota,
  origin latency, normal login, and webhook delivery. Do not log emails, signup
  bodies, IP histories, signing headers or credentials for monitoring.
- Trigger rollback if eligible registrations fail, sessions are lost, TLS/DNS/email
  fails, billing redirects or webhooks break, or gateway limits are approached
  without an approved capacity plan.
- **First turn origin enforcement off** and confirm normal registration behavior.
  Keep the older local-IP restriction off too. This reopens ordinary signups
  temporarily; it is safer than leaving the signup endpoint inaccessible.
- Only then restore the saved apex/www routing or nameservers as appropriate.
  Account for propagation: old and new routes can coexist, so leave the origin
  gate off throughout. Preserve matching DNSSEC and all mail records during rollback.
- Recheck HTTPS, public lessons, existing login, signup, email and webhook delivery.
  Rotate a signing credential if it may have been exposed; do not delete existing
  users, subscriptions, trials or the nonce table during an outage.
- Do not re-enable until the cause is understood and the staged checks pass.

## Official references (recheck before execution)

- https://docs.replit.com/features/publishing/custom-domains
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
- https://developers.cloudflare.com/workers/platform/pricing/
