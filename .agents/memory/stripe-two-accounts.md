---
name: Two live Stripe accounts
description: PlanWise has subscribers in two live Stripe accounts; subscription sync must check both and never downgrade on "not found".
---

- Main account "David Jackson (Teacher Dave)" is used through PLANWISE_STRIPE_SECRET. All new checkouts go here.
- Legacy account "Teacher Dave" is the Replit Stripe integration account (STRIPE_SECRET_KEY). At least one subscriber still pays through it (Oct 2026).
- Nothing used to switch accounts back to free when a subscription ended. A cancelled customer kept unlimited access for about 2.5 months until the Oct 2026 sync fix.

**Rule:** subscription sync only switches an account to free when Stripe positively reports an ended status (canceled/unpaid/incomplete_expired/paused). "Not found" and API errors leave the account unchanged. past_due still counts as paying.

**Why:** a subscription missing from the main account may live in the legacy one. In production the integration key may not reach the legacy account, so a "not found" downgrade would cut off a paying customer.

**How to apply:** any billing or access change must handle both accounts. Ask Dave before moving subscribers between the two accounts.
