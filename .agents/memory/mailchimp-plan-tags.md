---
name: Mailchimp "Unlimited" tag
description: Mailchimp's "Unlimited" tag must follow users.subscription_tier; the welcome flow's trial emails and Unlimited pitches depend on it.
---

- `server/mailchimp-plan-tags.ts` sets the tag "Unlimited" for accounts on the unlimited tier and removes it for everyone else who is or was linked to Stripe. Added November 2026.
- It runs for one customer after each Stripe subscription webhook (even when the tier didn't change, because checkout may already have set it), for one user after `/api/subscriptions/fetch-session`, and for every paying or previously-paying account at the end of `syncAllSubscriptions` (the scheduled sync). On Replit autoscale the scheduled sync is unreliable for this: it's skipped at start-up if any server ran it in the last 5.5 hours, and its timers don't fire while the app is scaled down. So after a deploy, an admin runs `POST /api/admin/mailchimp/sync-plan-tags` (`server/mailchimp-plan-tags-route.ts`), which tags everyone at once and returns the counts.
- It never creates Mailchimp members, and failures only log. Billing and access never depend on it.
- In Mailchimp (audience "Plan Wise ESL"), the "Welcome new contacts" flow sends trial emails: "your trial ends tomorrow" on day 4 and "your trial has ended" on day 6. It removes anyone tagged Unlimited. Campaigns that pitch Unlimited leave the tag out.

**Why:** Dave doesn't want any paying user told their trial is ending (November 2026). Mailchimp only knows email and name from sign-up, so without the tag it can't tell who has paid.

**How to apply:** any new way of granting or removing Unlimited must leave the tag correct. Calling `syncMailchimpPlanTagsForUsers([userId])` after the change is enough. Don't rename the tag without changing the Mailchimp flow and campaigns too.
