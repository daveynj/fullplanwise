// This script sets a high number of credits for a specific admin user

import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function setAdminCredits() {
  try {
    // We're targeting the specific daveynj account
    const targetUsername = 'daveynj';
    console.log(`Setting high credits for user "${targetUsername}"...`);
    
    // First, make sure this user has admin status
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.username, targetUsername));
    
    console.log(`Updated user ${targetUsername} to have admin status`);
    
    // Then update the credits to a very high number
    const updatedUser = await db
      .update(users)
      .set({ credits: 999999 })
      .where(eq(users.username, targetUsername))
      .returning();
      
    if (updatedUser.length === 0) {
      console.log(`User ${targetUsername} not found`);
      return;
    }
    
    console.log(`Updated user ${targetUsername} (ID: ${updatedUser[0].id}) to 999999 credits`);
    console.log('Admin credits update completed successfully');
  } catch (error) {
    console.error('Error setting admin credits:', error);
  } finally {
    process.exit(0);
  }
}

setAdminCredits();