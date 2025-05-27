// Migration script to add grammar_spotlight column
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addGrammarColumn() {
  try {
    console.log('Adding grammar_spotlight column to lessons table...');
    
    await pool.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS grammar_spotlight TEXT;
    `);
    
    console.log('✅ Successfully added grammar_spotlight column!');
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'grammar_spotlight';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified:', result.rows[0]);
    } else {
      console.log('❌ Column not found after creation');
    }
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addGrammarColumn(); 