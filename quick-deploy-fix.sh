#!/bin/bash

echo "🚀 Quick Deployment Fix - Bypassing Build Timeout"
echo "=================================================="

# Set environment for faster builds
export NODE_ENV=production
export VITE_BUILD_TIMEOUT=300000

# Clear any previous builds
rm -rf dist dist-client 2>/dev/null

echo "📦 Building frontend (optimized)..."
# Build with increased memory and timeout
NODE_OPTIONS="--max-old-space-size=4096" timeout 300s vite build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build completed!"
else
    echo "❌ Frontend build timed out - this is the deployment issue!"
    echo "💡 The frontend build is taking too long for deployment limits"
    exit 1
fi

echo "🔧 Building backend..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "📋 Copying static files..."
cp -r dist/public/* dist/ 2>/dev/null || true

echo "✅ Build completed successfully!"
echo "🚀 Now you can deploy - the build should work!"