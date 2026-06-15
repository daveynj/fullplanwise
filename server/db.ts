import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// NEON_DATABASE_URL takes priority over DATABASE_URL.
// This protects against Replit overriding DATABASE_URL with its internal
// "helium" database URL in production deployments, which would connect to
// an empty database and lose all user accounts.
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection');
console.log('Using connection source:', process.env.NEON_DATABASE_URL ? 'NEON_DATABASE_URL' : 'DATABASE_URL');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
