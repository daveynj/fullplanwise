import { pool } from "./db";
import type { BillingAlertState, BillingAlertStore } from "./billing-alerts";

// A separate namespace from subscription sync and checkout. Session lock spans
// enqueue + delivery + acknowledgment, but no DB transaction spans HTTP.
const LOCK = "billing-health-alerts-v1";
export const billingAlertStore: BillingAlertStore = {
  async exclusive(work) {
    const client = await pool.connect();
    let locked = false;
    let destroy = false;
    try {
      const result = await client.query("SELECT pg_try_advisory_lock(hashtext($1)) AS locked", [LOCK]);
      locked = result.rows[0]?.locked === true;
      if (!locked) return;
      // Match the project's idempotent runtime schema setup convention.
      await client.query(`CREATE TABLE IF NOT EXISTS billing_alert_state (
        name text PRIMARY KEY,
        state jsonb NOT NULL
      )`);
      const clock = await client.query("SELECT EXTRACT(EPOCH FROM clock_timestamp()) * 1000 AS now");
      await work({
        now: Number(clock.rows[0].now),
        async read() {
          const result = await client.query("SELECT state FROM billing_alert_state WHERE name = $1", [LOCK]);
          return (result.rows[0]?.state ?? { accounts: {}, pending: [] }) as BillingAlertState;
        },
        async write(state) {
          await client.query(`INSERT INTO billing_alert_state (name, state) VALUES ($1, $2::jsonb)
            ON CONFLICT (name) DO UPDATE SET state = EXCLUDED.state`, [LOCK, JSON.stringify(state)]);
        },
      });
    } finally {
      if (locked) {
        try {
          await client.query("SELECT pg_advisory_unlock(hashtext($1))", [LOCK]);
        } catch {
          destroy = true; // Never return a potentially locked connection to the pool.
        }
      }
      client.release(destroy);
    }
  },
};
