import axios, { AxiosResponse } from 'axios';

/**
 * Replicate FLUX Schnell image generation service
 * Fast, high-quality image generation using black-forest-labs/flux-schnell
 */
export class ReplicateFluxService {
  private apiKey: string;
  private baseURL: string = 'https://api.replicate.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Replicate API key not provided for image generation');
      this.apiKey = '';
    } else {
      this.apiKey = apiKey;
      const keyPattern = this.apiKey.substring(0, 8) + '...' + this.apiKey.substring(this.apiKey.length - 4);
      console.log(`ReplicateFluxService initialized with API key pattern: ${keyPattern}`);
    }
  }

  /**
   * Generate an image using FLUX Schnell model with retry logic for rate limits
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

    console.log(`Requesting FLUX image generation for prompt: "${prompt.substring(0, 100)}..."`);

    const maxRetries = 5;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Start the prediction
        const response: AxiosResponse = await axios.post(
          `${this.baseURL}/models/black-forest-labs/flux-schnell/predictions`,
          {
            input: {
              prompt: prompt,
              num_outputs: 1,
              aspect_ratio: "1:1",
              output_format: "png",
              output_quality: 80,
              go_fast: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        if (response.data && response.data.id) {
          console.log(`FLUX prediction started (${requestId}): ${response.data.id}`);
          
          // Wait for completion and return base64
          const result = await this.waitForPrediction(response.data.id, requestId);
          return result;
        } else {
          console.warn('FLUX API response did not contain prediction ID');
          return null;
        }
      } catch (error: any) {
        const is429 = error.response?.status === 429;
        const is503 = error.response?.status === 503;
        
        if (is429 || is503) {
          attempt++;
          const retryAfter = error.response?.data?.retry_after || 5;
          const backoffDelay = Math.min(retryAfter * 1000 + Math.random() * 1000, 15000);
          
          console.log(`⏳ Rate limit hit for ${requestId} (attempt ${attempt}/${maxRetries}), retrying in ${(backoffDelay/1000).toFixed(1)}s...`);
          
          if (attempt <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          } else {
            console.error(`✗ Failed to generate image for ${requestId} after ${maxRetries} retries (rate limit)`);
            return null;
          }
        } else {
          console.error(`✗ Error generating image for ${requestId}:`, error.message);
          if (error.response) {
            console.error('Replicate Error Details:', error.response.data);
          }
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Wait for a Replicate prediction to complete and return the result
   */
  private async waitForPrediction(predictionId: string, requestId: string): Promise<string | null> {
    const maxAttempts = 40; // Wait up to 4 minutes
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
          console.log(`Successfully received image data from FLUX API.`);
          
          // Convert image URL to base64
          if (prediction.output && prediction.output.length > 0) {
            const imageUrl = prediction.output[0];
            return await this.downloadImageAsBase64(imageUrl, requestId);
          }
          return null;
        } else if (prediction.status === 'failed') {
          console.error(`FLUX prediction failed (${requestId}):`, prediction.error);
          return null;
        } else {
          // Still processing, wait and retry
          console.log(`FLUX prediction ${prediction.status} (${requestId}), waiting...`);
          await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
          attempts++;
        }
      } catch (error: any) {
        console.error(`Error checking prediction status (${requestId}):`, error.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }

    console.error(`FLUX prediction timed out after ${maxAttempts} attempts (${requestId})`);
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
      
      console.log(`Image downloaded and converted to base64 (${requestId})`);
      return base64;
    } catch (error: any) {
      console.error(`Error downloading image (${requestId}):`, error.message);
      return null;
    }
  }

  /**
   * Generate multiple images for batch processing
   */
  async generateImagesBatch(prompts: string[], requestIds?: string[]): Promise<(string | null)[]> {
    console.log(`Starting batch FLUX image generation for ${prompts.length} images`);

    const results = await Promise.all(
      prompts.map((prompt, index) => {
        const requestId = requestIds?.[index] || `batch-${index}`;
        return this.generateImage(prompt, requestId);
      })
    );

    const successful = results.filter(result => result !== null).length;
    console.log(`Batch FLUX generation complete: ${successful}/${results.length} successful`);

    return results;
  }
}

// Export an instance initialized with the Replicate API key
export const replicateFluxService = new ReplicateFluxService(process.env.REPLICATE_API_TOKEN || '');