import axios from 'axios';
import * as fs from 'fs';

const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image';
const NEGATIVE_PROMPT = "blurry, distorted, text, words, letters, low quality, noisy, artifacts";

/**
 * Service for interacting with the Stability AI API
 */
export class StabilityService {
  private apiKey: string;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      console.warn('Stability API key is not provided or is empty. Image generation will be disabled.');
      this.apiKey = '';
    } else {
       this.apiKey = apiKey;
       const keyPattern = this.apiKey.substring(0, 4) + '...' + this.apiKey.substring(this.apiKey.length - 4);
       console.log(`StabilityService initialized with API key pattern: ${keyPattern}`);
    }
  }

  /**
   * Generate an image using Stability AI based on a prompt
   * @param prompt The text prompt describing the image
   * @param requestId Optional unique identifier for logging
   * @returns Base64 encoded PNG image data, or null if generation fails or is disabled
   */
  async generateImage(prompt: string, requestId: string = 'image'): Promise<string | null> {
    if (!this.apiKey) {
      console.log('Stability API key not configured, skipping image generation.');
      return null;
    }
    if (!prompt || prompt.trim() === '') {
        console.warn('Empty image prompt provided, skipping generation.');
        return null;
    }

    console.log(`Requesting Stability image generation for prompt: "${prompt.substring(0, 100)}..."`);

    // Create logs/images directory if it doesn't exist
    const imageLogDir = './logs/images';
     if (!fs.existsSync(imageLogDir)) {
       try {
         fs.mkdirSync(imageLogDir, { recursive: true });
       } catch (dirError: any) {
          console.error(`Error creating image log directory: ${dirError.message}`);
          // Continue without saving debug info if directory creation fails
       }
     }

    try {
      const response = await axios.post(
        STABILITY_API_URL,
        {
          text_prompts: [{ text: prompt }, { text: NEGATIVE_PROMPT, weight: -0.7 }], // Add negative prompt with slight negative weight
          height: 512, // Smallest size for SD 1.6
          width: 512,
          samples: 1,
          cfg_scale: 7, // Default guidance scale
          steps: 25, // Lower steps for potentially faster/cheaper generation
          style_preset: "photographic", // Use a style preset if desired (optional)
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json', // Request JSON response
          },
          timeout: 60000 // 60 second timeout
        }
      );

      if (response.data && response.data.artifacts && response.data.artifacts.length > 0 && response.data.artifacts[0].base64) {
        console.log('Successfully received image data from Stability API.');
        const base64Data = response.data.artifacts[0].base64;

        // Optionally save the generated image for debugging
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const imageFileName = `${requestId}_${timestamp}.png`;
        const imagePath = `${imageLogDir}/${imageFileName}`;
        
        try {
           fs.writeFileSync(imagePath, base64Data, 'base64');
           console.log(`Generated image saved for debugging: ${imagePath}`);
        } catch (saveError: any) {
            console.error(`Error saving generated image: ${saveError.message}`);
        }

        return base64Data;
      } else {
        console.warn('Stability API response did not contain expected image data.', response.data);
        return null;
      }
    } catch (error: any) {
      console.error('Error calling Stability AI API:', error.message);
      if (error.response) {
        console.error('Stability API Error Details:');
        console.error('Status:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Stability API No Response Error:');
      }
      return null;
    }
  }
}

// Export an instance initialized with the API key from environment variables
export const stabilityService = new StabilityService(process.env.STABILITY_API_KEY);
