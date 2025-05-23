// Add this file to make sure environment variables are properly set in production
// This should be imported at the very beginning of server/index.ts

// Load environment variables - this runs before any other imports
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First try to load from .env file
try {
  const envFile = path.join(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    console.log('Loading environment variables from .env file');
    const envConfig = fs.readFileSync(envFile, 'utf8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=', 2))
      .reduce((acc, [key, value]) => {
        if (key && value !== undefined) {
          acc[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
        }
        return acc;
      }, {});
      
    // Set environment variables
    Object.entries(envConfig).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  }
} catch (error) {
  console.error('Error loading .env file:', error);
}

// Log database connection info (without exposing the password)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database connection string format:', 
  dbUrl.replace(/:[^:]*@/, ':***@').substring(0, 30) + '...');

export default {};