import axios, { AxiosResponse } from 'axios';

/**
 * Replicate Google Imagen-4-Fast image generation service
 * Fast, high-quality image generation using google/imagen-4-fast
 */
export class ReplicateImagenService {
  private apiKey: string;
  private baseURL: string = 'https://api.replicate.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Replicate API key not provided for image generation');
      this.apiKey = '';
    } else {
      this.apiKey = apiKey;
      const keyPattern = this.apiKey.substring(0, 8) + '...' + this.apiKey.substring(this.apiKey.length - 4);
      console.log(`ReplicateImagenService initialized with API key pattern: ${keyPattern}`);
    }
  }

  /**
   * Generate an image using Google Imagen-4-Fast model
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

    console.log(`Requesting Imagen-4-Fast image generation for prompt: "${prompt.substring(0, 100)}..."`);

    try {
      // Start the prediction
      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/models/google/imagen-4-fast/predictions`,
        {
          input: {
            prompt: prompt,
            num_outputs: 1,
            width: 1024,
            height: 1024,
            output_format: "png"
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
        console.log(`Imagen prediction started (${requestId}): ${response.data.id}`);
        
        // Wait for completion and return base64
        const result = await this.waitForPrediction(response.data.id, requestId);
        return result;
      } else {
        console.warn('Imagen API response did not contain prediction ID');
        return null;
      }
    } catch (error: any) {
      console.error('Error calling Imagen-4-Fast via Replicate:', error.message);
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
          console.log(`Successfully received image data from Imagen-4-Fast API.`);
          
          // Convert image URL to base64
          if (prediction.output) {
            // Imagen-4-Fast returns a string URL directly, not an array like FLUX
            const imageUrl = typeof prediction.output === 'string' ? prediction.output : prediction.output[0];
            console.log(`Extracted image URL (${requestId}): ${imageUrl}`);
            return await this.downloadImageAsBase64(imageUrl, requestId);
          }
          return null;
        } else if (prediction.status === 'failed') {
          console.error(`Imagen prediction failed (${requestId}):`, prediction.error);
          return null;
        } else {
          // Still processing, wait and retry
          console.log(`Imagen prediction ${prediction.status} (${requestId}), waiting...`);
          await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
          attempts++;
        }
      } catch (error: any) {
        console.error(`Error checking prediction status (${requestId}):`, error.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }

    console.error(`Imagen prediction timed out after ${maxAttempts} attempts (${requestId})`);
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
    console.log(`Starting batch Imagen-4-Fast image generation for ${prompts.length} images`);

    const results = await Promise.all(
      prompts.map((prompt, index) => {
        const requestId = requestIds?.[index] || `batch-${index}`;
        return this.generateImage(prompt, requestId);
      })
    );

    const successful = results.filter(result => result !== null).length;
    console.log(`Batch Imagen-4-Fast generation complete: ${successful}/${results.length} successful`);

    return results;
  }
}

// Export an instance initialized with the Replicate API key
export const replicateFluxService = new ReplicateImagenService(process.env.REPLICATE_API_TOKEN || '');