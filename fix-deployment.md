# Deployment Fix Instructions

## Problem
When deploying your ESL teaching platform, you're seeing the error: `{"message":"The requested endpoint could not be found, or you don't have access to it. Please check the provided ID and try again."}`

This happens because the database connection isn't properly configured in the production environment.

## Solution

1. **Before deploying**, make sure to do the following:

   - Click the "Secrets" tool (key icon) in the left sidebar
   - Add all database environment variables manually:
     - DATABASE_URL
     - PGPORT
     - PGUSER
     - PGPASSWORD
     - PGDATABASE
     - PGHOST

2. **After adding the secrets**, deploy again by clicking the "Deploy" button in the top bar.

This will ensure your database connection works properly in the deployed application.

## Verifying It Works

After deployment, you should be able to:
1. Login with your credentials
2. Access all your lessons
3. Create new lessons with the target vocabulary feature
4. See all admin features working correctly

If you still experience issues, check the logs in the deployment dashboard to see if there are any specific error messages.