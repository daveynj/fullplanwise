---
name: Stripe webhook dev/prod conflict
description: Why only production registers the Stripe managed webhook.
---

Dev and production share the same live Stripe key and the same database. stripe-replit-sync's findOrCreateManagedWebhook keeps a single managed webhook per account and deletes any with a different URL. When dev also registered it, every dev restart deleted production's endpoint and pointed live events at the replit.dev URL, which failed while the workspace slept. Stripe then emailed Dave about a failing live endpoint (Oct 2026).

**Rule:** webhook registration only runs when NODE_ENV === "production". Production re-registers on every boot (daves-lesson-gen.replit.app).

**Why it was low-risk for subscribers:** access is granted at checkout via the session lookup (subscriptionTier = 'unlimited'). Webhooks only update the mirrored `stripe` schema tables, and Stripe charges subscribers regardless of webhooks.
