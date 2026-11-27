---
name: Registration region policy
description: Country restrictions apply to new teacher signups and their automatic trials, not public browsing or existing members.
---

Block new signups and the automatic free trial for visitors located in India or Bangladesh. Keep public lessons, public browsing, existing-member login, and existing paid subscriptions accessible. Do not retroactively revoke existing accounts or trials.

**Why:** The owner explicitly chose to block signups and free trials in these two countries because they are outside the target audience, rather than blocking access to the whole site.

**How to apply:** Enforce on the server before account creation and marketing enrollment, not merely on the signup button. Country is an IP-location estimate, not nationality, and VPNs can bypass it. Do not trust a country supplied by the browser.

Verify real visitor-IP visibility before enabling fail-closed country checks on a host. Preview requests can contain only internal proxy hops, including from the browser-testing environment; this is not evidence of visitors' countries or proof of production behavior.

**Why:** A fixed one-hop proxy assumption or an internal-only forwarded chain can make every visitor appear unlocatable and deny all new registrations.

**How to apply:** Confirm a trusted public client address on the actual external request path before activation. Never assume the leftmost forwarded header is authentic or trust a browser-supplied country header.

A country-aware gateway does not make the direct Replit origin private. DNS routing alone must never be treated as enforcement of this signup policy.

**Why:** Someone can call the independently reachable hosting address instead of the branded domain, bypassing an edge-only rule. Country checks based on the gateway's egress IP are also not checks of the visitor's location.

**How to apply:** Require authenticated, request-bound gateway country decisions at the signup origin when gateway enforcement is enabled. Preserve the scope boundary: public content, existing-member login, and billing must not depend on signup attestation. Keep rollout and rollback owner-approved; disable origin enforcement before reverting DNS.

Billing return URLs must use a trusted environment-specific public origin, never the Host received behind the gateway.

**Why:** The origin sees its independent hosting hostname, while customers' session cookies belong to the public site. A checkout return to the hosting hostname loses that authenticated session; response-redirect rewriting cannot fix URLs embedded when the Stripe session is created.

**How to apply:** Configure the staging and production public URL before gateway enforcement, and test the success/cancel URLs passed to Stripe as well as the host-scoped authenticated return. Do not trust caller-supplied forwarding headers as the public URL.
