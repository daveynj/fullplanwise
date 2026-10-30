# Administrator billing-health alerts

Set `BILLING_ALERT_WEBHOOK_URL` to an administrator-controlled **HTTPS JSON
webhook receiver** that routes messages to the desired email, chat, or incident
channel. No administrator address or third-party service is assumed. If the URL
contains a token, keep the entire URL in Secrets, not source control. The receiver
must accept the contract below; a raw Slack/Discord incoming webhook expects a
different payload and needs an adapter.

External delivery is explicitly disabled when this setting is absent, with a
fixed warning in server logs. An invalid URL also produces a safe warning.
Configure the destination before relying on alerts; restart after changing it.
Do not put Stripe keys in this URL.

## Behavior

- The existing production timer checks both configured merchants every five
  minutes, even without a dashboard visit. Stripe operations remain read-only.
- Two matching observations at least four minutes apart confirm a status,
  including recovery. Brief outages and a single bad check do not alert.
- Initial healthy status is silent; an initially broken account alerts after
  confirmation. Each merchant has independent confirmation state.
- PostgreSQL stores the confirmed status, candidate status, and pending queue.
  A shared advisory lock and database clock prevent simultaneous instances or
  restarts from duplicating confirmations. Dashboard reads do not send alerts.
- `invalid_credentials` and `permission_denied` are categorized as `credentials`;
  rate limits, connection errors, and provider 5xx failures are `provider_outage`.
  Other configuration problems retain their distinct sanitized status.
- Delivery has an eight-second timeout, rejects redirects, and requires a 2xx
  response. No response body, URL, raw Stripe error, key, or customer data is logged.
- Failed deliveries remain queued and retry on the next scheduled check, in
  order, with at most ten deliveries per cycle. Recovery is queued even if the
  failure could not yet be delivered; timestamps describe the original transition.
- Delivery is **at least once**: a crash after receiver acceptance but before
  database acknowledgment, or an ambiguous timeout, can cause a retry. Receivers
  must deduplicate the stable `Idempotency-Key` header (also the JSON `id`).
  Successful acknowledgment removes the pending event.

## Receiver contract

`POST`, `Content-Type: application/json`, `Idempotency-Key: <event UUID>`:

```json
{
  "id": "event UUID",
  "type": "billing_health.failure",
  "account": "primary",
  "previousStatus": "healthy",
  "status": "invalid_credentials",
  "category": "credentials",
  "confirmedAt": "2026-10-30T12:05:00.000Z"
}
```

`account` is `primary` or `legacy`. Recovery uses
`type: "billing_health.recovery"`, `status: "healthy"`, `category: "recovery"`.
All payload fields are generated identifiers, fixed enums, or a timestamp.

## Operational limits

This is an in-process production timer, not an external uptime service. If all
autoscale instances are asleep, or the application/database is down, it cannot
check or deliver until an instance runs again. A database failure is logged
safely and retried; there is deliberately no in-memory fallback that could
duplicate alerts across instances. Configure independent uptime monitoring if
notifications must work while the entire application is unavailable.
