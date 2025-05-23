# Deployment Instructions

## Before Deploying
1. Make sure your database credentials are correct in the `.env.deploy` file
2. Run the pre-deploy script: `./pre-deploy.sh`

## Deploy Process
1. Click "Deploy" in Replit interface
2. Wait for the build process to complete
3. Visit your deployed app URL

## Troubleshooting
If you see database connection errors:
1. Check that your Neon database is accepting connections from the deployment server
2. Verify credentials in .env.deploy match your actual database credentials
3. Make sure your database is not in hibernation mode
