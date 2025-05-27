#!/bin/bash

# This script will help update the database secrets for deployment

# Clear screen
clear

# Define colors for nice output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}      DATABASE SECRETS UPDATE FOR DEPLOYMENT          ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo
echo -e "${GREEN}To fix the deployment issue, follow these steps:${NC}"
echo
echo "1. Go to the Secrets tab (key icon) in the Replit sidebar"
echo
echo "2. Delete all existing database secrets (if any)"
echo 
echo "3. Add the following secrets with your actual database values:"
echo
echo "   DATABASE_URL: [Your Neon database connection string]"
echo "   PGDATABASE: [Your database name]"
echo "   PGHOST: [Your database host]"
echo "   PGPORT: 5432"
echo "   PGUSER: [Your database user]"
echo "   PGPASSWORD: [Your database password]"
echo
echo "4. After updating all secrets, click the Deploy button"
echo
echo -e "${BLUE}======================================================${NC}"
echo "This will ensure your database connection works in deployment."
echo -e "${BLUE}======================================================${NC}"