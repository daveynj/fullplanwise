import axios, { AxiosResponse } from 'axios';

/**
 * Image generation service using OpenRouter API
 * Supports multiple models for cost optimization and quality choices
 */
export class ImageGenerationService {
  private apiKey: string;
  private baseURL: string = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('OpenRouter API key not provided for image generation');
      this.apiKey = '';
    } else {
      this.apiKey = apiKey;
      console.log('ImageGenerationService initialized with OpenRouter');
    }
  }

  /**
   * Generate an image using the fastest/cheapest available model
   * @param prompt The text prompt describing the image
   * @param requestId Optional unique identifier for logging
   * @returns Base64 encoded PNG image data, or null if generation fails
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

    console.log(`Generating image via OpenRouter: "${prompt.substring(0, 100)}..."`);

    // Use Fireworks AI for fast, cheap generation
    return this.generateWithFireworks(prompt, requestId);
  }

  /**
   * Generate image using Fireworks AI - Fast and cheap (~$0.002 per image)
   */
  private async generateWithFireworks(prompt: string, requestId: string): Promise<string | null> {
    const negativePrompt = "blurry, distorted, text, words, letters, low quality, noisy, artifacts, ugly, deformed";

    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model: 'fireworks/stable-diffusion-xl-1024-v1-0',
          prompt: prompt,
          negative_prompt: negativePrompt,
          size: '1024x1024',
          n: 1,
          response_format: 'b64_json'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://planwiseesl.com',
            'X-Title': 'PlanwiseESL'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data && response.data.data && response.data.data[0] && response.data.data[0].b64_json) {
        console.log(`✅ Image generated successfully with Fireworks AI (${requestId})`);
        return response.data.data[0].b64_json;
      } else {
        console.warn('Fireworks API response did not contain expected image data');
        return null;
      }
    } catch (error: any) {
      console.error('Error calling Fireworks AI via OpenRouter:', error.message);
      if (error.response) {
        console.error('OpenRouter Error Details:', error.response.data);
      }
      return null;
    }
  }

  /**
   * Generate image using Stable Diffusion XL via OpenRouter
   * Fallback option if Fireworks is unavailable
   */
  private async generateWithSDXL(prompt: string, requestId: string): Promise<string | null> {
    const negativePrompt = "blurry, distorted, text, words, letters, low quality, noisy, artifacts";

    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model: 'stabilityai/stable-diffusion-xl-base-1.0',
          prompt: prompt,
          negative_prompt: negativePrompt,
          size: '1024x1024',
          n: 1,
          response_format: 'b64_json'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://planwiseesl.com',
            'X-Title': 'PlanwiseESL'
          },
          timeout: 45000 // 45 second timeout
        }
      );

      if (response.data && response.data.data && response.data.data[0] && response.data.data[0].b64_json) {
        console.log(`✅ Image generated successfully with SDXL (${requestId})`);
        return response.data.data[0].b64_json;
      } else {
        console.warn('SDXL API response did not contain expected image data');
        return null;
      }
    } catch (error: any) {
      console.error('Error calling SDXL via OpenRouter:', error.message);
      return null;
    }
  }

  /**
   * Generate image using Flux - High quality but more expensive
   */
  private async generateWithFlux(prompt: string, requestId: string): Promise<string | null> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model: 'black-forest-labs/flux-1.1-pro',
          prompt: prompt,
          size: '1024x1024',
          n: 1,
          response_format: 'b64_json'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://planwiseesl.com',
            'X-Title': 'PlanwiseESL'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      if (response.data && response.data.data && response.data.data[0] && response.data.data[0].b64_json) {
        console.log(`✅ Image generated successfully with Flux (${requestId})`);
        return response.data.data[0].b64_json;
      } else {
        console.warn('Flux API response did not contain expected image data');
        return null;
      }
    } catch (error: any) {
      console.error('Error calling Flux via OpenRouter:', error.message);
      return null;
    }
  }

  /**
   * Generate multiple images synchronously for batch processing
   * @param prompts Array of text prompts
   * @param requestIds Optional array of identifiers for logging
   * @returns Array of base64 encoded images (null for failed generations)
   */
  async generateImagesBatch(prompts: string[], requestIds?: string[]): Promise<(string | null)[]> {
    console.log(`Starting batch image generation for ${prompts.length} images`);

    const results = await Promise.all(
      prompts.map((prompt, index) => {
        const requestId = requestIds?.[index] || `batch-${index}`;
        return this.generateImage(prompt, requestId);
      })
    );

    const successful = results.filter(result => result !== null).length;
    console.log(`Batch image generation complete: ${successful}/${results.length} successful`);

    return results;
  }
}

// Export an instance initialized with the API key from environment variables
export const imageGenerationService = new ImageGenerationService(process.env.OPENROUTER_API_KEY || '');

/**
 * Test function to compare image generation performance
 */
export const testImageGeneration = async (): Promise<void> => {
  console.log('🧪 Testing OpenRouter image generation...');

  const testPrompt = 'A friendly ESL teacher helping students in a classroom, professional, educational setting';

  try {
    const service = new ImageGenerationService(process.env.OPENROUTER_API_KEY || '');
    if (!service.apiKey) {
      console.error('❌ OPENROUTER_API_KEY not configured');
      return;
    }

    console.log('Testing single image generation...');
    const startTime = Date.now();
    const result = await service.generateImage(testPrompt, 'test-image');
    const duration = Date.now() - startTime;

    if (result) {
      console.log(`✅ Single image generated successfully in ${duration}ms`);
    } else {
      console.log('❌ Single image generation failed');
    }

    console.log('Testing batch image generation...');
    const batchPrompts = [
      'Students practicing English conversation in pairs',
      'Teacher writing vocabulary on whiteboard',
      'Classroom library with English books'
    ];

    const batchStartTime = Date.now();
    const batchResults = await service.generateImagesBatch(batchPrompts, ['test1', 'test2', 'test3']);
    const batchDuration = Date.now() - batchStartTime;

    const successful = batchResults.filter(r => r !== null).length;
    console.log(`✅ Batch generation: ${successful}/${batchResults.length} successful in ${batchDuration}ms`);

  } catch (error: any) {
    console.error('❌ Image generation test failed:', error.message);
  }
};






