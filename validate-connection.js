// This script validates the database connection using the current connection string

import pg from 'pg';
const { Pool } = pg;

async function validateConnection() {
  try {
    // Print the database URL with the password masked
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.replace(/:[^:]*@/, ':***@');
    console.log(`Testing connection to: ${maskedUrl}`);
    
    // Create a new pool using the environment variable
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Connection successful!');
    console.log(`Current database time: ${result.rows[0].time}`);
    
    // Check for existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`\nFound ${tables.rows.length} tables in the database:`);
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nDetailed error information:');
    console.error(error);
    
    // Provide troubleshooting advice
    console.log('\n--- TROUBLESHOOTING TIPS ---');
    console.log('1. Check if the DATABASE_URL environment variable is set correctly');
    console.log('2. Verify that the database server is running and accessible');
    console.log('3. Ensure your IP is allowed in the database firewall settings');
    console.log('4. Check that the database user and password are correct');
  }
}

validateConnection();