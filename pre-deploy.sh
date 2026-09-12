#!/bin/bash
# Pre-deploy check: verifies the secrets this app needs are present.
# Secrets are managed via Replit Secrets (Tools > Secrets), not .env files.

echo "Checking required environment variables..."

REQUIRED_VARS=(
  NEON_DATABASE_URL
  SESSION_SECRET
  OPENROUTER_API_KEY
  REPLICATE_API_TOKEN
  PLANWISE_STRIPE_SECRET
  PLANWISE_STRIPE_PUBLIC
)

missing=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  MISSING: $var"
    missing=1
  else
    echo "  OK: $var"
  fi
done

if [ "$missing" -ne 0 ]; then
  echo ""
  echo "Pre-deployment check FAILED."
  echo "Add the missing variables in Replit Secrets (Tools > Secrets), then re-run."
  exit 1
fi

echo "Pre-deployment check passed."
