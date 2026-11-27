import { sql } from "drizzle-orm";
import { db } from "./db";

let initialized: Promise<unknown> | undefined;

/** Shared Postgres uniqueness, not a per-process Set (autoscale has many instances).
 * No SQL runs while gateway enforcement is off. A failed setup is retryable.
 */
export async function consumeRegistrationNonce(hash: string, expiresAt: Date): Promise<boolean> {
  if (!initialized) {
    initialized = db.execute(sql`
      CREATE TABLE IF NOT EXISTS registration_gateway_nonces (
        nonce_hash text PRIMARY KEY,
        expires_at timestamptz NOT NULL
      )
    `).catch((error) => { initialized = undefined; throw error; });
  }
  await initialized;
  return db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM registration_gateway_nonces WHERE expires_at < now()`);
    const result = await tx.execute(sql`
      INSERT INTO registration_gateway_nonces (nonce_hash, expires_at)
      VALUES (${hash}, ${expiresAt.toISOString()}::timestamptz)
      ON CONFLICT (nonce_hash) DO NOTHING RETURNING nonce_hash
    `);
    return result.rows.length === 1;
  });
}
