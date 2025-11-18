import Replicate from "replicate";

/**
 * Replicate FLUX Schnell image generation service
 * Fast, high-quality image generation using black-forest-labs/flux-schnell
 */
export class ReplicateFluxService {
  private replicate: Replicate;

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Replicate API key not provided for image generation');
    }
    this.replicate = new Replicate({
      auth: apiKey,
    });
  }

  /**
   * Generate an image using FLUX Schnell model with the synchronous API
   * @param prompt The text prompt describing the image
   * @param requestId Optional unique identifier for logging
   * @returns Base64 encoded PNG image data, or null if generation fails
   */
  async generateImage(prompt: string, requestId: string = 'image'): Promise<string | null> {
    if (!this.replicate.auth) {
      console.log('Replicate API key not configured, skipping image generation.');
      return null;
    }
    if (!prompt || prompt.trim() === '') {
      console.warn('Empty image prompt provided, skipping generation.');
      return null;
    }

    console.log(`Requesting FLUX image generation for prompt: "${prompt.substring(0, 100)}..."`);

    try {
      const output = await this.replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: prompt,
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "png",
            output_quality: 80,
            go_fast: true
          }
        }
      );

      if (output) {
        // The output is a URL to the generated image.
        // We need to download it and convert it to base64.
        const imageUrl = output[0];
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        console.log(`Image downloaded and converted to base64 (${requestId})`);
        return base64;
      }

      return null;
    } catch (error: any) {
      console.error(`✗ Error generating image for ${requestId}:`, error.message);
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
