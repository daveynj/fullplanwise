// Test script to check grammar analysis functionality
const { Pool } = require('pg');

async function testGrammarFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://db:password@localhost:5432/planwise'
  });

  try {
    console.log('🔍 Testing Grammar Analysis Fix...\n');
    
    // 1. Check database connection
    console.log('1. Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');
    
    // 2. Check if grammar_spotlight column exists
    console.log('2. Checking for grammar_spotlight column...');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'grammar_spotlight';
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ grammar_spotlight column exists:', columnCheck.rows[0]);
    } else {
      console.log('❌ grammar_spotlight column missing! Adding it...');
      await pool.query('ALTER TABLE lessons ADD COLUMN grammar_spotlight TEXT;');
      console.log('✅ Added grammar_spotlight column');
    }
    console.log('');
    
    // 3. Check recent lessons for grammar data
    console.log('3. Checking recent lessons for grammar data...');
    const recentLessons = await pool.query(`
      SELECT id, title, 
             CASE 
               WHEN grammar_spotlight IS NULL THEN 'NULL'
               WHEN grammar_spotlight = '' THEN 'EMPTY'
               ELSE 'HAS DATA'
             END as grammar_status,
             LENGTH(grammar_spotlight) as data_length,
             created_at
      FROM lessons 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    console.log('Recent lessons:');
    recentLessons.rows.forEach(lesson => {
      console.log(`  📖 Lesson ${lesson.id}: "${lesson.title.substring(0, 30)}..." - Grammar: ${lesson.grammar_status} (${lesson.data_length || 0} chars)`);
    });
    
    // 4. Test the grammar analyzer directly
    console.log('\n4. Testing grammar analyzer...');
    
    const testContent = `
    Natural access control is all about making it clear how people should enter and exit a space. 
    If there's a well-lit path leading to a welcoming entrance, you're more likely to follow it. 
    The area should be designed carefully to prevent wandering into restricted areas.
    `;
    
    // Simple pattern test (since we can't import the TypeScript module here)
    const modalVerbs = testContent.match(/\b(?:should|would|could|will|can|might|may|must)\s+\w+/gi);
    const articles = testContent.match(/\b(?:the|a|an)\s+\w+/gi);
    const prepositions = testContent.match(/\b(?:into|to|in|about|of)\s+\w+/gi);
    
    console.log(`Found patterns in test content:`);
    console.log(`  Modal verbs: ${modalVerbs ? modalVerbs.length : 0} (${modalVerbs ? modalVerbs.slice(0, 2).join(', ') : 'none'})`);
    console.log(`  Articles: ${articles ? articles.length : 0} (should be many)`);  
    console.log(`  Prepositions: ${prepositions ? prepositions.length : 0} (${prepositions ? prepositions.slice(0, 2).join(', ') : 'none'})`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Try generating a new lesson through the UI');
    console.log('2. Check the server logs for "Grammar pattern detected" message');
    console.log('3. Look for the grammarSpotlight field in the lesson response');
    console.log('4. If still not working, check browser console for errors');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testGrammarFix(); 