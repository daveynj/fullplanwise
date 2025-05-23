#!/usr/bin/env node

/**
 * Enhanced production build script that ensures API routes are preserved
 * in the deployed application.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Print colorful messages
const print = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`)
};

// Ensure we can run the script
process.on('unhandledRejection', (err) => {
  print.error(`Fatal error: ${err}`);
  process.exit(1);
});

print.info('🔨 Starting enhanced production build...');

// Step 1: Build the application
print.info('\n📦 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  print.success('✅ Build completed successfully!');
} catch (error) {
  print.error('❌ Build failed. Please fix the errors and try again.');
  process.exit(1);
}

// Step 2: Create a production .env file with essential variables
print.info('\n🔧 Creating production environment configuration...');
const prodEnvPath = path.join(process.cwd(), 'dist', '.env.production');

const envContent = `
# Database configuration
DATABASE_URL=${process.env.DATABASE_URL || ''}
PGPORT=${process.env.PGPORT || ''}
PGUSER=${process.env.PGUSER || ''}
PGPASSWORD=${process.env.PGPASSWORD || ''}
PGDATABASE=${process.env.PGDATABASE || ''}
PGHOST=${process.env.PGHOST || ''}

# Node environment
NODE_ENV=production
PORT=5000
`;

fs.writeFileSync(prodEnvPath, envContent);
print.success('✅ Production environment configuration created!');

// Step 3: Create a start script to load environment variables and start the app
print.info('\n🚀 Creating startup script...');
const startScriptPath = path.join(process.cwd(), 'dist', 'start.sh');
const startScript = `#!/bin/bash
# Load environment variables from .env.production file
set -a
source .env.production
set +a

# Start the application
node index.js
`;

fs.writeFileSync(startScriptPath, startScript);
fs.chmodSync(startScriptPath, '755'); // Make executable
print.success('✅ Startup script created!');

// Step 4: Verify that key files exist in the distribution
print.info('\n🔍 Verifying distribution files...');
const requiredFiles = [
  'index.js',
  'client'
];

let missingFiles = false;
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), 'dist', file);
  if (!fs.existsSync(filePath)) {
    print.error(`❌ Missing file: ${file}`);
    missingFiles = true;
  }
}

if (missingFiles) {
  print.warning('⚠️ Some required files are missing. The deployment may not work correctly.');
} else {
  print.success('✅ All required files verified!');
}

// Final instructions
print.info(`
🚀 Production build completed! 

To deploy your application:
1. Make sure all required environment variables are set in your deployment environment
2. Use "node index.js" as your startup command
3. Ensure the database is properly configured

💡 Note: If you encounter API errors with the message "endpoint not found", 
   it means your application can't find the proper environment variables.
   Make sure DATABASE_URL and other required variables are set correctly.
`);