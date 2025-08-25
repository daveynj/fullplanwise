// Environment variable test script
console.log('🔍 Environment Variable Test Results:\n');

// Test all possible variations
const variations = [
  'OPENROUTER_API_KEY',
  'openrouter_api_key',
  'OPENROUTERAPIKEY',
  'openrouterapikey'
];

variations.forEach(key => {
  const value = process.env[key];
  console.log(`${key}:`, value ? `✅ SET (length: ${value.length})` : '❌ NOT SET');
});

console.log('\n📋 Next Steps:');
console.log('1. Check your Replit Secrets (Tools > Secrets)');
console.log('2. Verify the exact key name: OPENROUTER_API_KEY');
console.log('3. Make sure the value starts with: sk-or-v1-');
console.log('4. Restart your Replit application completely');
console.log('5. Check the server logs for the detailed startup messages');
