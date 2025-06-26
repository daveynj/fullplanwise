import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon with error handling
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection');

// Add connection configuration with improved error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Further reduced pool size
  idleTimeoutMillis: 30000, // Shorter idle timeout
  connectionTimeoutMillis: 10000, // Longer connection timeout
  allowExitOnIdle: false,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.warn('Database pool error (continuing):', err.message);
});

// Add connection test function with timeout
export async function testDatabaseConnection() {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    const queryPromise = pool.query('SELECT 1');
    const result = await Promise.race([queryPromise, timeoutPromise]);
    console.log('Database connection successful:', { success: true });
    return true;
  } catch (error) {
    console.warn('Database connection issue (continuing):', error.message);
    return false;
  }
}

// Test connection at startup
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('Database connection validated at startup');
    }
  })
  .catch(() => {
    console.log('Database connection check completed');
  });

export const db = drizzle({ client: pool, schema });
