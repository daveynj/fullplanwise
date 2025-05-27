import { db, pool } from './server/database';

async function addGrammarColumn() {
  try {
    console.log('🔧 Adding grammar_spotlight column to lessons table...');
    
    // Use raw SQL to add the column
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
    
    console.log('🎉 Migration complete! You can now generate lessons with grammar analysis.');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
  } finally {
    process.exit(0);
  }
}

addGrammarColumn(); 