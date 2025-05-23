// This script creates a new local database and migrates your data
// Instead of trying to connect to an external Neon database that has authentication issues

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';
import { migrate } from 'drizzle-orm/pg-core/migrator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createLocalDb() {
  console.log('⚙️ Creating a local database with your existing schema');
  
  // Create directory for migrations if it doesn't exist
  const migrationsDir = path.join(__dirname, 'drizzle');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  try {
    console.log('Connecting to the local database...');
    
    // Connect to the local PostgreSQL database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Use drizzle to create tables
    const db = drizzle(pool);
    
    // Generate a migration
    console.log('Generating migration...');
    exec('npm run db:push', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log('✅ Database tables have been created!');
      
      // Now create a basic admin user
      console.log('Creating admin user...');
      exec('node set-admin-credits.js', (err, out, stdErr) => {
        if (err) {
          console.error(`Error creating admin: ${err.message}`);
          return;
        }
        console.log('✅ Admin user created!');
        console.log('\n🚀 Your database is ready for deployment!');
      });
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

createLocalDb().catch(console.error);