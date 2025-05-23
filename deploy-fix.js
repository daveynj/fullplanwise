// Script to prepare application for deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Preparing application for deployment...');

// Build the application
console.log('📦 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Create a production .env file if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), '.env.production'))) {
  console.log('📝 Creating production environment file...');
  const envContent = `NODE_ENV=production
PORT=5000
${fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : ''}`;
  
  fs.writeFileSync('.env.production', envContent);
  console.log('✅ Production environment file created!');
}

console.log('🚀 Application ready for deployment!');
console.log('ℹ️ To deploy your application:');
console.log('   1. Click the "Run" button to start the application');
console.log('   2. Click the "Deploy" button in the top right corner');