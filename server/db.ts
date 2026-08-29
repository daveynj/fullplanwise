import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import { resolveDatabaseConfig } from "./database-url";

console.log('Initializing database connection');
export const databaseConfig = resolveDatabaseConfig();
console.log('Using database source:', databaseConfig.source);

export const pool = new Pool({
  connectionString: databaseConfig.connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
