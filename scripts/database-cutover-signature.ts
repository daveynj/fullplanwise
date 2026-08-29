import { Pool } from "pg";
import { getDatabaseCutoverSignature } from "../server/database-cutover";
import { resolveDatabaseConfig } from "../server/database-url";

const config = resolveDatabaseConfig();
const pool = new Pool({
  connectionString: config.connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

try {
  const signature = await getDatabaseCutoverSignature(pool);
  console.log(`Database source: ${config.source}`);
  console.log(`Cutover signature: ${signature}`);
} finally {
  await pool.end();
}