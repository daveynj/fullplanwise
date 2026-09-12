# Deployment Instructions

## Before Deploying
1. Make sure all required secrets are set in Replit Secrets (Tools > Secrets):
   - `NEON_DATABASE_URL` — production Neon database connection string
   - `SESSION_SECRET` — session signing secret
   - `OPENROUTER_API_KEY`, `REPLICATE_API_TOKEN` — AI providers
   - `PLANWISE_STRIPE_SECRET`, `PLANWISE_STRIPE_PUBLIC` — Stripe keys
2. Run the pre-deploy check to confirm nothing is missing:
   ```
   ./pre-deploy.sh
   ```

## Deploy Process
1. Click "Deploy" in the Replit interface
2. Wait for the build process to complete
3. Visit your deployed app URL

## Troubleshooting
If you see database connection errors:
1. Verify `NEON_DATABASE_URL` is set correctly in Replit Secrets
2. Check that your Neon database is accepting connections from the deployment server
3. Make sure your database is not in hibernation mode
