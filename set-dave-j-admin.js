// Script to directly set "dave j" account as admin using direct database updates
// This avoids having to deal with sessions in Node.js

import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function setDaveJAsAdmin() {
  try {
    // First, check if dave j user exists
    const daveJUser = await db.select().from(users).where(eq(users.username, 'dave j')).limit(1);
    
    if (daveJUser.length === 0) {
      console.log('User "dave j" does not exist yet. Users need to be created through registration.');
      console.log('Please register a user with username "dave j" before running this script.');
      return;
    }
    
    // Update admin status
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.username, 'dave j'))
      .returning();
    
    const { password, ...userDisplay } = updatedUser;
    console.log('Successfully set "dave j" as admin:', userDisplay);
  } catch (error) {
    console.error('Error setting "dave j" as admin:', error.message);
  }
}

// Run the script
setDaveJAsAdmin().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});