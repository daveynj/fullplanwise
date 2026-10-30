# Billing health

The admin dashboard checks both existing merchants with read-only Stripe requests.
It also verifies the main account's configured live monthly price and product.
The legacy check verifies the original merchant account ID, not just whether its
key is valid. Replacing its key with a main-account key therefore raises a warning.
No check creates charges, modifies subscriptions, or switches accounts.

## Credentials

- `PLANWISE_STRIPE_SECRET`: main merchant, used for new checkouts.
- `PLANWISE_STRIPE_PUBLIC`: main merchant's publishable key.
- `PLANWISE_STRIPE_LEGACY_SECRET`: existing legacy merchant's secret key. Use this
  user-owned name to configure or restore legacy access in production.
- `STRIPE_SECRET_KEY`: existing integration fallback when available. Do not try to
  restore production access by creating a user secret with this integration-owned name.

The legacy name is shared by health checks and subscription synchronization. It
must hold credentials for the original legacy merchant, never a main-account key.
Use the project's secure secret settings, not chat, to enter or rotate credentials.
Rotating a key is not permission to migrate subscribers or change merchant identity.
Do not change the pinned legacy merchant identity just to make a warning disappear.

## Timing and recovery

Production starts checks 20 seconds after startup and repeats every five minutes
while a server is running. The dashboard polls every minute; checks are cached for
up to one minute and concurrent requests share one check. Checks do not keep an
idle deployment running and do not currently send email.

After restoring a credential for the same merchant, select **Check again** after
the one-minute cache expires. Confirm both account results are healthy. Check
production separately after its configuration is updated; workspace success does
not verify production settings.

Authentication failures, wrong-account credentials, missing credentials, permissions,
price problems and temporary Stripe unavailability have different messages.
Unavailable or failed checks never imply healthy billing.
Logs contain fixed status labels only, never raw Stripe authentication errors.
