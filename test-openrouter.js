// Quick test script to verify OpenRouter API key setup
console.log('🔍 Testing OpenRouter API Key Configuration...\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('   Length:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0);

// Check if it starts with expected prefix
if (process.env.OPENROUTER_API_KEY) {
  const key = process.env.OPENROUTER_API_KEY;
  console.log('   Starts with sk-or-v1:', key.startsWith('sk-or-v1-') ? '✅ YES' : '❌ NO');
  console.log('   First 10 chars:', key.substring(0, 10) + '...');
}

// Test the service initialization
console.log('\n2. Service Initialization:');
try {
  const { geminiService } = require('./server/services/gemini.ts');
  console.log('   ✅ Service loaded successfully');
} catch (error) {
  console.log('   ❌ Service failed to load:', error.message);
}

console.log('\n📋 Troubleshooting Steps:');
console.log('1. Go to Tools > Secrets in Replit');
console.log('2. Add key: OPENROUTER_API_KEY');
console.log('3. Value: Your OpenRouter API key (starts with sk-or-v1-)');
console.log('4. Restart your application');
console.log('5. Check the console logs for the detailed messages above');
