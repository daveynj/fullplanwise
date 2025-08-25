// Test OpenRouter API Connection
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function testConnection() {
  try {
    console.log('🔍 Testing OpenRouter API connection...');

    const response = await client.chat.completions.create({
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from OpenRouter!"'
        }
      ],
      max_tokens: 50,
    });

    console.log('✅ Connection successful!');
    console.log('Response:', response.choices[0]?.message?.content);
    console.log('Model used:', response.model);

  } catch (error) {
    console.log('❌ Connection failed:');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
}

testConnection();
