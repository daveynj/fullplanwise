#!/usr/bin/env node

/**
 * Deployment optimization script
 * This helps resolve deployment timeout issues by optimizing the build process
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting optimized deployment build...');

try {
  // Increase Node.js memory limit for build process
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  console.log('🔧 Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}