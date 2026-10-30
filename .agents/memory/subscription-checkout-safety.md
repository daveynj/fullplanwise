---
name: Subscription checkout safety
description: Duplicate-purchase prevention and safe uncertainty handling across the two Stripe accounts.
---

New purchases must check both configured billing accounts, including older customer records, before offering another checkout. A local paid tier alone does not prove a subscription is still running; a positively canceled subscriber may return even before tier sync catches up. Missing records or failed lookups must never clear billing links or remove existing access.

**Why:** The same teacher can have billing history in two merchants. Replacing a customer ID merely because it is absent from the main merchant can hide an existing paid subscription and lead to duplicate charges.

**How to apply:** Serialize checkout requests across app instances, reuse an open checkout, and keep creation idempotent across uncertain responses. Exercise billing changes with mocked providers only; development shares live billing credentials.

Saving a replacement customer is not subscription activation; it must leave both the existing subscription reference and access tier untouched.

**Why:** A historical canceled subscription ID is still non-null. Treating any non-null subscription link as paid while saving a customer grants access before payment.

**How to apply:** Check storage-side effects, not just route arguments. Regression tests for checkout must exercise the real storage methods with mocked database transport.

Checkout has stricter eligibility rules than access sync: paused and unpaid subscriptions block a new purchase because they can recover. Email matches alone never prove customer or checkout ownership.

**Why:** Two app accounts can share an email, and recovering a paused or unpaid subscription after opening another one can result in two charges.

**How to apply:** Recover customer links only with matching user metadata; reuse an open checkout only when its user metadata matches. Preserve historical database links conservatively, reject explicit ownership conflicts, and permit replacement only for terminal canceled/incomplete-expired subscriptions.
