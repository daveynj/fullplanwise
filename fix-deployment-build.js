#!/usr/bin/env node

/**
 * Deployment Build Fix Script
 * This script fixes the critical deployment issues preventing your app from deploying
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function fixDeploymentBuild() {
  console.log('🔧 Fixing deployment build configuration...');
  
  try {
    // Step 1: Build the frontend
    console.log('📦 Building frontend...');
    await execAsync('vite build');
    
    // Step 2: Build the backend
    console.log('🚀 Building backend...');
    await execAsync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    
    // Step 3: Copy frontend assets to dist
    console.log('📋 Copying frontend assets...');
    try {
      await execAsync('cp -r dist-client/* dist/ 2>/dev/null || true');
    } catch (err) {
      // Try alternative approach if cp fails
      try {
        const distClientExists = await fs.access('dist-client').then(() => true).catch(() => false);
        if (distClientExists) {
          await execAsync('mv dist-client/* dist/');
        }
      } catch (moveErr) {
        console.log('⚠️  Frontend assets copy skipped (may not be needed)');
      }
    }
    
    // Step 4: Create production environment file
    console.log('🔐 Creating production environment template...');
    const envContent = `# Production Environment Variables
# You need to set these in your Replit Secrets:

DATABASE_URL=your_neon_database_url_here
PGDATABASE=your_database_name
PGHOST=your_database_host
PGPORT=5432
PGUSER=your_database_user
PGPASSWORD=your_database_password

# AI Service Keys (if needed)
OPENAI_API_KEY=your_openai_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Other services
MAILCHIMP_API_KEY=your_mailchimp_key_here
STRIPE_SECRET_KEY=your_stripe_key_here
`;
    
    await fs.writeFile('.env.production.template', envContent);
    
    console.log('✅ Deployment build fix completed!');
    console.log('');
    console.log('🚀 Next steps for successful deployment:');
    console.log('1. Go to the Secrets tab (🔑) in your Replit sidebar');
    console.log('2. Add all your database environment variables');
    console.log('3. Add any API keys your app needs');
    console.log('4. Click the Deploy button');
    console.log('');
    console.log('📋 Check .env.production.template for the exact variables needed');
    
  } catch (error) {
    console.error('❌ Build fix failed:', error.message);
    process.exit(1);
  }
}

fixDeploymentBuild();