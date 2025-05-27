// This script ensures your deployment uses the correct database settings

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m"
};

// Log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Create a pre-deploy hook to ensure database environment variables are available in production
try {
  log("🔧 Creating pre-deploy fix for database connection...", colors.blue);
  
  // Note: Database credentials should be set via Replit Secrets, not written to files
  log("⚠️  WARNING: Database credentials should be configured via Replit Secrets", colors.yellow);
  log("📝 To deploy securely:", colors.blue);
  log("   1. Go to Secrets tab in Replit sidebar", colors.blue);
  log("   2. Add DATABASE_URL and other DB credentials as secrets", colors.blue);
  log("   3. Deploy using the Deploy button", colors.blue);
  
  // Create a pre-deploy script to ensure the secrets are copied correctly
  const buildFilePath = path.join(process.cwd(), 'pre-deploy.sh');
  const buildContent = `#!/bin/bash
echo "Preparing for deployment..."
echo "Ensuring database environment variables are available..."
cp .env.deploy .env
echo "Pre-deployment setup complete!"
`;

  writeFileSync(buildFilePath, buildContent);
  execSync(`chmod +x ${buildFilePath}`);
  log("✅ Created pre-deploy script", colors.green);
  
  // Create clear deployment instructions
  const instructionsPath = path.join(process.cwd(), 'DEPLOYMENT.md');
  const instructions = `# Deployment Instructions

## Before Deploying
1. Make sure your database credentials are correct in the \`.env.deploy\` file
2. Run the pre-deploy script: \`./pre-deploy.sh\`

## Deploy Process
1. Click "Deploy" in Replit interface
2. Wait for the build process to complete
3. Visit your deployed app URL

## Troubleshooting
If you see database connection errors:
1. Check that your Neon database is accepting connections from the deployment server
2. Verify credentials in .env.deploy match your actual database credentials
3. Make sure your database is not in hibernation mode
`;

  writeFileSync(instructionsPath, instructions);
  log("✅ Created deployment instructions", colors.green);
  
  log("\n🚀 Deployment fix is ready!", colors.bright + colors.green);
  log("Follow these steps:", colors.yellow);
  log("1. Run ./pre-deploy.sh before deployment", colors.reset);
  log("2. Click Deploy in the Replit interface", colors.reset);
  log("3. Check your deployed app", colors.reset);
  
} catch (error) {
  log(`❌ Error: ${error.message}`, colors.red);
  process.exit(1);
}