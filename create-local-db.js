
import { exec } from 'child_process';

async function createLocalDb() {
  console.log('⚙️ Creating a local database with your existing schema');
  
  try {
    console.log('Running drizzle-kit push...');
    exec('npx drizzle-kit push', (error, stdout, stderr) => {
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
      console.log('\n🚀 Your database is ready for deployment!');
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

createLocalDb().catch(console.error);
