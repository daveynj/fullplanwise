// This script sets a high number of credits for the admin user

import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function setAdminCredits() {
  try {
    console.log('Setting high credits for admin user...');
    
    // Update user by username - we know you're using daveynj as your username
    const targetUsername = 'daveynj';
    
    // First, update this username to have admin status
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.username, targetUsername));
    
    console.log(`Updated user ${targetUsername} to have admin status`);
    
    // Then update the credits
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
    
    // Also update all admin users to have high credits
    for (const user of adminUsers) {
      const updatedUser = await db
        .update(users)
        .set({ credits: 999999 })
        .where(eq(users.id, user.id))
        .returning();
      
      console.log(`Updated user ${user.username} (ID: ${user.id}) to 999999 credits`);
    }
    
    console.log('Admin credits update completed successfully');
  } catch (error) {
    console.error('Error setting admin credits:', error);
  } finally {
    process.exit(0);
  }
}

setAdminCredits();