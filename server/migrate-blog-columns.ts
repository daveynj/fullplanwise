import { db } from './db';
import { sql } from 'drizzle-orm';

async function addBlogColumns() {
  console.log('Adding new blog columns...');
  
  try {
    // Add featured_image_url column
    await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image_url TEXT`);
    console.log('✓ Added featured_image_url');
    
    // Add featured_image_alt column
    await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image_alt TEXT`);
    console.log('✓ Added featured_image_alt');
    
    // Add published_at column
    await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`);
    console.log('✓ Added published_at');
    
    // Add is_published column
    await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false NOT NULL`);
    console.log('✓ Added is_published');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addBlogColumns();
