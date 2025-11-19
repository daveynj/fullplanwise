import { v4 as uuidv4 } from 'uuid';

interface RunwareImageInferenceRequest {
  taskType: 'imageInference';
  taskUUID: string;
  positivePrompt: string;
  model: string;
  width: number;
  height: number;
  numberResults?: number;
  outputType?: 'URL' | 'base64Data' | 'dataURI';
  outputFormat?: 'JPG' | 'PNG' | 'WEBP';
  steps?: number;
  CFGScale?: number;
}

interface RunwareImageInferenceResponse {
  taskType: 'imageInference';
  taskUUID: string;
  imageUUID: string;
  imageURL?: string;
  imageBase64Data?: string;
  seed?: number;
  NSFWContent?: boolean;
  cost?: number;
}

interface RunwareAPIResponse {
  data?: RunwareImageInferenceResponse[];
  errors?: Array<{
    code: string;
    message: string;
    parameter?: string;
    type?: string;
    taskType?: string;
  }>;
}

/**
 * Service for generating images using the Runware API
 * Uses HTTP REST API for simplicity (recommended for batch operations)
 */
export class RunwareService {
  private apiKey: string;
  private apiUrl = 'https://api.runware.ai/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Runware API key not provided for image generation');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate an image using Runware API with Flux Schnell model
   * @param prompt The text prompt describing the image
   * @param requestId Optional unique identifier for logging
   * @returns Base64 encoded image data, or null if generation fails
   */
  async generateImage(prompt: string, requestId: string = 'image'): Promise<string | null> {
    if (!this.apiKey) {
      console.log('Runware API key not configured, skipping image generation.');
      return null;
    }
    if (!prompt || prompt.trim() === '') {
      console.warn('Empty image prompt provided, skipping generation.');
      return null;
    }

    console.log(`Requesting Runware Flux Schnell image generation for prompt: "${prompt.substring(0, 100)}..."`);

    const taskUUID = uuidv4();
    const requestBody: RunwareImageInferenceRequest[] = [
      {
        taskType: 'imageInference',
        taskUUID,
        positivePrompt: prompt,
        model: 'runware:100@1', // Flux Schnell model
        width: 256,
        height: 256,
        numberResults: 1,
        outputType: 'base64Data',
        outputFormat: 'PNG'
      }
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`✗ Runware API error for ${requestId}: ${response.status} ${response.statusText}`);
        return null;
      }

      const result: RunwareAPIResponse = await response.json();

      if (result.errors && result.errors.length > 0) {
        console.error(`✗ Runware API returned errors for ${requestId}:`, result.errors);
        return null;
      }

      if (result.data && result.data.length > 0) {
        const imageData = result.data[0];
        
        if (imageData.imageBase64Data) {
          console.log(`✓ Image generated successfully (${requestId})`);
          return imageData.imageBase64Data;
        } else if (imageData.imageURL) {
          // Fallback: download from URL if base64 not provided
          console.log(`Downloading image from URL for ${requestId}...`);
          const imageResponse = await fetch(imageData.imageURL);
          const buffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          console.log(`✓ Image downloaded and converted to base64 (${requestId})`);
          return base64;
        }
      }

      console.error(`✗ No image data in response for ${requestId}`);
      return null;
    } catch (error: any) {
      console.error(`✗ Error generating image for ${requestId}:`, error.message);
      return null;
    }
  }

  /**
   * Generate multiple images in a single batch request
   * Runware supports multiple tasks in one request for efficiency
   */
  async generateImagesBatch(prompts: string[], requestIds?: string[]): Promise<(string | null)[]> {
    if (!this.apiKey) {
      console.log('Runware API key not configured, skipping batch image generation.');
      return prompts.map(() => null);
    }

    console.log(`Starting Runware Flux Schnell batch generation for ${prompts.length} images`);

    // Create all tasks in a single request
    const tasks: RunwareImageInferenceRequest[] = prompts.map((prompt, index) => ({
      taskType: 'imageInference',
      taskUUID: uuidv4(),
      positivePrompt: prompt,
      model: 'runware:100@1', // Flux Schnell
      width: 256,
      height: 256,
      numberResults: 1,
      outputType: 'base64Data',
      outputFormat: 'PNG'
    }));

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(tasks)
      });

      if (!response.ok) {
        console.error(`✗ Runware batch API error: ${response.status} ${response.statusText}`);
        return prompts.map(() => null);
      }

      const result: RunwareAPIResponse = await response.json();

      if (result.errors && result.errors.length > 0) {
        console.error('✗ Runware batch API returned errors:', result.errors);
        return prompts.map(() => null);
      }

      if (!result.data || result.data.length === 0) {
        console.error('✗ No data in batch response');
        return prompts.map(() => null);
      }

      // Map responses back to original order using taskUUID
      const results: (string | null)[] = new Array(prompts.length).fill(null);
      const taskUUIDMap = new Map(tasks.map((task, index) => [task.taskUUID, index]));

      for (const imageData of result.data) {
        const index = taskUUIDMap.get(imageData.taskUUID);
        if (index !== undefined) {
          if (imageData.imageBase64Data) {
            results[index] = imageData.imageBase64Data;
          } else if (imageData.imageURL) {
            // Fallback: download from URL
            try {
              const imageResponse = await fetch(imageData.imageURL);
              const buffer = await imageResponse.arrayBuffer();
              results[index] = Buffer.from(buffer).toString('base64');
            } catch (err) {
              console.error(`✗ Error downloading image ${index}:`, err);
            }
          }
        }
      }

      const successful = results.filter(r => r !== null).length;
      console.log(`✓ Runware batch generation complete: ${successful}/${prompts.length} successful`);

      return results;
    } catch (error: any) {
      console.error('✗ Error in batch image generation:', error.message);
      return prompts.map(() => null);
    }
  }
}

export const runwareService = new RunwareService(process.env.RUNWARE_API_KEY || '');
