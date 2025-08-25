// This file can be used to test OpenRouter integration
// Run with: node test-openrouter.js
import { testOpenRouterConnection } from './server/services/gemini.ts';

async function test() {
  console.log('Testing OpenRouter connection...');
  const success = await testOpenRouterConnection();
  if (success) {
    console.log('✅ OpenRouter integration test passed!');
  } else {
    console.log('❌ OpenRouter integration test failed!');
  }
  process.exit(success ? 0 : 1);
}

test().catch(console.error);
