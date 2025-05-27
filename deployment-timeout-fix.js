#!/usr/bin/env node

/**
 * Deployment Timeout Fix
 * This script optimizes the build to prevent timeouts during deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function fixDeploymentTimeout() {
  console.log('🚀 Fixing deployment timeout issues...');
  
  try {
    // Create optimized vite config for production builds
    const optimizedViteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@assets': resolve(__dirname, './attached_assets'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog'],
          icons: ['lucide-react'],
          motion: ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
})
`;

    // Write optimized config
    await fs.writeFile('vite.config.optimized.ts', optimizedViteConfig);
    
    // Create fast build script
    const fastBuildScript = `#!/bin/bash
echo "🚀 Starting optimized build..."

# Build frontend with optimized config
VITE_CONFIG=vite.config.optimized.ts vite build --config vite.config.optimized.ts

# Build backend
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Optimized build completed!"
`;

    await fs.writeFile('fast-build.sh', fastBuildScript);
    await execAsync('chmod +x fast-build.sh');
    
    console.log('✅ Deployment timeout fix created!');
    console.log('');
    console.log('🔧 To use the optimized build:');
    console.log('1. Run: ./fast-build.sh');
    console.log('2. Then deploy with the generated dist folder');
    console.log('');
    console.log('💡 This should complete build much faster and avoid timeouts');
    
  } catch (error) {
    console.error('❌ Fix creation failed:', error.message);
  }
}

fixDeploymentTimeout();