---
name: Stripe secrets naming
description: Why STRIPE_SECRET_KEY doesn't work as a user-set secret in production, and what names to use instead.
---

# Stripe Secrets Naming

## The Rule
Never use `STRIPE_SECRET_KEY` or `VITE_STRIPE_PUBLIC_KEY` as user-set Replit secrets for this project. Use `PLANWISE_STRIPE_SECRET` and `PLANWISE_STRIPE_PUBLIC` instead.

**Why:** These two names (`STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`) are owned by the Replit Stripe integration. In the dev environment, the integration automatically injects them into `process.env` — so they appear to work. But in the production deployment the integration injection doesn't happen, and user-set secrets with those same names are silently ignored (Replit doesn't let user secrets override integration-owned names). The result: dev works, production gets "Stripe API key not configured".

**How to apply:** Any time Stripe credentials need to be added as secrets, use `PLANWISE_STRIPE_SECRET` (secret key) and `PLANWISE_STRIPE_PUBLIC` (publishable key). The `server/stripeClient.ts` reads both names with fallback: `PLANWISE_STRIPE_SECRET || STRIPE_SECRET_KEY` and `PLANWISE_STRIPE_PUBLIC || VITE_STRIPE_PUBLIC_KEY`.

## Related
- The `initStripe()` in `server/index.ts` also had a bug using `DATABASE_URL` (which is "helium" in production) instead of `NEON_DATABASE_URL || DATABASE_URL` — fixed at the same time.
