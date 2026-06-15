---
name: Production DB connection
description: How to safely connect to Neon in both dev and production on Replit autoscale deployments.
---

## The Rule

Always use `NEON_DATABASE_URL` (not `DATABASE_URL`) as the primary connection secret. Fall back to `DATABASE_URL` only if `NEON_DATABASE_URL` is absent.

**Why:** Replit's autoscale production runtime injects its own `DATABASE_URL` pointing to an internal "helium" PostgreSQL service, overriding the user's secret. This causes the app to connect to an empty database, losing all user accounts and data.

**How to apply:** `server/db.ts` is already written to do `process.env.NEON_DATABASE_URL || process.env.DATABASE_URL`. Never revert to DATABASE_URL-only logic. The `NEON_DATABASE_URL` secret is set in Replit Secrets.

## Driver

Use `drizzle-orm/node-postgres` with standard `pg` Pool — NOT `@neondatabase/serverless`. The serverless/WebSocket driver fails against Replit's helium hostname in production. Standard pg works with both Neon (via SSL) and helium.

## SSL

Pool is created with `ssl: { rejectUnauthorized: false }` to satisfy Neon's SSL requirement without strict cert validation.
