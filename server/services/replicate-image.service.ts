import axios, { AxiosResponse } from 'axios';

/**
 * Simple Replicate image generation service using FLUX Schnell
 * Cost: ~$0.003 per image (0.3 cents)
 * Much more reliable than OpenRouter (which doesn't support image generation)
 */
export class ReplicateImageService {
  private apiKey: string;
  private baseURL: string = 'https://api.replicate.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Replicate API key not provided for image generation');
      this.apiKey = '';
    } else {
      this.apiKey = apiKey;
      console.log('ReplicateImageService initialized with FLUX Schnell');
    }
  }

  /**
   * Generate an image using FLUX Schnell (fastest/cheapest model)
   * @param prompt The text prompt describing the image
   * @param requestId Optional unique identifier for logging
   * @returns Base64 encoded PNG image data, or null if generation fails
   */
  async generateImage(prompt: string, requestId: string = 'image'): Promise<string | null> {
    if (!this.apiKey) {
      console.log('Replicate API key not configured, skipping image generation.');
      return null;
    }
    if (!prompt || prompt.trim() === '') {
      console.warn('Empty image prompt provided, skipping generation.');
      return null;
    }

    console.log(`Generating image via Replicate FLUX: "${prompt.substring(0, 100)}..."`);

    try {
      // Start the prediction
      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/models/black-forest-labs/flux-schnell/predictions`,
        {
          input: {
            prompt: prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            output_format: 'png',
            go_fast: true  // Use optimized version for faster generation
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      if (response.data && response.data.id) {
        console.log(`🚀 FLUX prediction started (${requestId}): ${response.data.id}`);
        
        // Wait for completion and return base64
        const result = await this.waitForPrediction(response.data.id, requestId);
        return result;
      } else {
        console.warn('FLUX API response did not contain prediction ID');
        return null;
      }
    } catch (error: any) {
      console.error('Error calling FLUX Schnell via Replicate:', error.message);
      if (error.response) {
        console.error('Replicate Error Details:', error.response.data);
      }
      return null;
    }
  }

  /**
   * Wait for a Replicate prediction to complete and return the result
   */
  private async waitForPrediction(predictionId: string, requestId: string): Promise<string | null> {
    const maxAttempts = 30; // Wait up to 3 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response: AxiosResponse = await axios.get(
          `${this.baseURL}/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const prediction = response.data;
        
        if (prediction.status === 'succeeded') {
          console.log(`✅ FLUX image generated successfully (${requestId})`);
          
          // Convert image URL to base64
          if (prediction.output && prediction.output.length > 0) {
            const imageUrl = prediction.output[0];
            return await this.downloadImageAsBase64(imageUrl, requestId);
          }
          return null;
        } else if (prediction.status === 'failed') {
          console.error(`❌ FLUX prediction failed (${requestId}):`, prediction.error);
          return null;
        } else {
          // Still processing, wait and retry
          console.log(`⏳ FLUX prediction ${prediction.status} (${requestId}), attempt ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          attempts++;
        }
      } catch (error: any) {
        console.error(`Error checking prediction status (${requestId}):`, error.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.error(`⏰ FLUX prediction timed out after ${maxAttempts} attempts (${requestId})`);
    return null;
  }

  /**
   * Download an image from URL and convert to base64
   */
  private async downloadImageAsBase64(imageUrl: string, requestId: string): Promise<string | null> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      const base64 = buffer.toString('base64');
      
      console.log(`📥 Image downloaded and converted to base64 (${requestId})`);
      return base64;
    } catch (error: any) {
      console.error(`Error downloading image (${requestId}):`, error.message);
      return null;
    }
  }

  /**
   * Generate multiple images synchronously for batch processing
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

// Export an instance initialized with the Replicate API key
export const replicateImageService = new ReplicateImageService(process.env.REPLICATE_API_TOKEN || '');