import { OpenAI } from 'openai';

/**
 * Service for interacting with OpenRouter API using Amazon Titan Image Generator
 */
export class StabilityService {
  private apiKey: string;
  private client: OpenAI | null = null;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      console.warn('OpenRouter API key is not provided or is empty. Image generation will be disabled.');
      this.apiKey = '';
    } else {
       this.apiKey = apiKey;
       const keyPattern = this.apiKey.substring(0, 4) + '...' + this.apiKey.substring(this.apiKey.length - 4);
       console.log(`AmazonTitanService initialized with API key pattern: ${keyPattern}`);

       this.client = new OpenAI({
         apiKey: this.apiKey,
         baseURL: 'https://openrouter.ai/api/v1',
       });
    }
  }

  /**
   * Generate an image using a cheaper alternative via OpenRouter
   * Note: OpenRouter has limited image generation models. This is a placeholder implementation.
   * In production, you might want to use a direct provider or different service.
   * @param prompt The text prompt describing the image
   * @param requestId Optional unique identifier for logging
   * @returns Base64 encoded PNG image data, or null if generation fails or is disabled
   */
  async generateImage(prompt: string, requestId: string = 'image'): Promise<string | null> {
    if (!this.apiKey) {
      console.log('OpenRouter API key not configured, skipping image generation.');
      return null;
    }
    if (!prompt || prompt.trim() === '') {
        console.warn('Empty image prompt provided, skipping generation.');
        return null;
    }

    console.log(`Image generation requested: "${prompt.substring(0, 100)}..."`);
    console.log('⚠️  OpenRouter has limited image generation support. Consider using direct providers.');

    if (!this.client) {
      console.log('OpenRouter client not initialized');
      return null;
    }

    // For now, return null to indicate no image generation
    // TODO: Implement with a direct image generation service like:
    // - Replicate (for Stable Diffusion models)
    // - Together AI (for image models)
    // - OpenAI DALL-E (if available)
    return null;

    // Alternative implementation using text-to-image models if available:
    /*
    try {
      const result = await this.client.chat.completions.create({
        model: 'stability/stability-sd3-medium', // If available on OpenRouter
        messages: [
          {
            role: 'user',
            content: `Generate an educational image: ${prompt}. Make it suitable for ESL classroom use.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      // Handle response based on model's output format
      const response = result.choices[0]?.message?.content;
      console.log('Image generation response:', response);

      // You'd need to parse the response and extract base64 or handle URLs
      return null; // Placeholder

    } catch (error: any) {
      console.error('Error calling image generation API:', error.message);
      return null;
    }
    */
  }
}

// Export an instance initialized with the OpenRouter API key from environment variables
export const stabilityService = new StabilityService(process.env.OPENROUTER_API_KEY);
