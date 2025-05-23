#!/bin/bash
echo "Preparing for deployment..."
echo "Ensuring database environment variables are available..."
cp .env.deploy .env
echo "Pre-deployment setup complete!"
