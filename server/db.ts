import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection');

// Add connection configuration with timeouts and error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced pool size for better connection management
  idleTimeoutMillis: 60000, // Keep connections open longer (60 seconds)
  connectionTimeoutMillis: 5000, // Faster timeout for new connections
  maxUses: Infinity, // Allow unlimited uses per connection
  allowExitOnIdle: false, // Don't exit process when idle
  maxLifetimeSeconds: 0 // No max lifetime limit
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
});

// Add connection test function
export async function testDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT 1');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Run the test immediately to check connection at startup
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('Database connection validated at startup');
    } else {
      console.error('Database connection failed at startup, but continuing anyway');
    }
  })
  .catch(error => {
    console.error('Error during database validation:', error);
  });

export const db = drizzle({ client: pool, schema });
