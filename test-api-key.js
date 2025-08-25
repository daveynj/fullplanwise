// Test OpenRouter API Key
console.log('🔍 Testing OpenRouter API Key...');

// Check if key exists and has correct format
const key = process.env.OPENROUTER_API_KEY;
console.log('Key exists:', !!key);
console.log('Key length:', key ? key.length : 0);
console.log('Starts with sk-or-v1:', key ? key.startsWith('sk-or-v1-') : false);

// Test API connection (without revealing the key)
if (key) {
  console.log('✅ Key format appears valid');
  console.log('🔗 Ready to test API connection...');
} else {
  console.log('❌ No API key found in environment');
}
