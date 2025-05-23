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
echo "3. Add the following secrets with these exact values:"
echo
echo "   DATABASE_URL: postgresql://neondb_owner:npg_n4SGo6BJvIqk@ep-wild-lab-a6kxw8q8.us-west-2.aws.neon.tech/neondb?sslmode=require"
echo "   PGDATABASE: neondb"
echo "   PGHOST: ep-wild-lab-a6kxw8q8.us-west-2.aws.neon.tech"
echo "   PGPORT: 5432"
echo "   PGUSER: neondb_owner"
echo "   PGPASSWORD: npg_n4SGo6BJvIqk"
echo
echo "4. After updating all secrets, click the Deploy button"
echo
echo -e "${BLUE}======================================================${NC}"
echo "This will ensure your database connection works in deployment."
echo -e "${BLUE}======================================================${NC}"