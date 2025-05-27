const { Pool } = require('pg');

async function testDatabase() {
  // Create a new pool for this test
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://db:password@localhost:5432/planwise'
  });

  try {
    console.log('Testing database connection...');
    
    // Test connection
    const testResult = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful:', testResult.rows[0]);
    
    // Check if grammar_spotlight column exists
    console.log('Checking for grammar_spotlight column...');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'grammar_spotlight';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ grammar_spotlight column already exists:', columnCheck.rows[0]);
    } else {
      console.log('⚠️  grammar_spotlight column not found, adding it...');
      
      // Add the column
      await pool.query(`
        ALTER TABLE lessons 
        ADD COLUMN grammar_spotlight TEXT;
      `);
      
      console.log('✅ Successfully added grammar_spotlight column!');
      
      // Verify it was added
      const verifyResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'lessons' AND column_name = 'grammar_spotlight';
      `);
      
      if (verifyResult.rows.length > 0) {
        console.log('✅ Column verified:', verifyResult.rows[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
    console.log('🎉 Test complete!');
  }
}

testDatabase(); 