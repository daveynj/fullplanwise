// Script to create necessary production files for deployment
import fs from 'fs';
import path from 'path';

console.log('🚀 Preparing application for deployment...');

// Create a directory for deployment files if it doesn't exist
const deployDir = path.join(process.cwd(), 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// Create a production .env file with environment variables
const envContent = `
# Database connection settings
DATABASE_URL=${process.env.DATABASE_URL || ''}
PGPORT=${process.env.PGPORT || ''}
PGUSER=${process.env.PGUSER || ''}
PGPASSWORD=${process.env.PGPASSWORD || ''}
PGDATABASE=${process.env.PGDATABASE || ''}
PGHOST=${process.env.PGHOST || ''}

# Node environment
NODE_ENV=production
`;

fs.writeFileSync(path.join(deployDir, '.env.production'), envContent);
console.log('✅ Created environment configuration file');

// Create a simple start script
const startScript = `
#!/bin/bash
# Load environment variables
set -a
source .env.production
set +a

# Start the application
node dist/index.js
`;

fs.writeFileSync(path.join(deployDir, 'start.sh'), startScript);
fs.chmodSync(path.join(deployDir, 'start.sh'), '755');
console.log('✅ Created startup script');

// Instructions for deployment
const instructions = `
=== DEPLOYMENT INSTRUCTIONS ===

1. Run the build command:
   npm run build

2. Deploy with the following:
   - Set DATABASE_URL environment variable in your deployment
   - Add other environment variables as needed
   - Use "node dist/index.js" as your startup command

Your application should now be properly configured for deployment!
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), instructions);
console.log('✅ Created deployment instructions');

console.log('\n🎉 Deployment preparation completed!');
console.log('📝 Check the "deploy" directory for configuration files and instructions');