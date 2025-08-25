// Test OpenRouter image generation
import { testImageGeneration } from './server/services/image-generation.service.ts';

async function test() {
  console.log('🧪 Testing OpenRouter image generation...');
  await testImageGeneration();
}

test().catch(console.error);
