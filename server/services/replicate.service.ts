interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string;
  urls?: {
    get?: string;
  };
}

export class ReplicateService {
  private apiToken: string;
  private apiUrl = 'https://api.replicate.com/v1';
  private maxPollAttempts = 60;
  private pollIntervalMs = 2000;

  constructor(apiToken: string) {
    if (!apiToken) {
      console.warn('Replicate API token not provided for image generation');
    }
    this.apiToken = apiToken;
  }

  private async pollPrediction(predictionUrl: string, requestId: string): Promise<ReplicatePrediction | null> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));

      const response = await fetch(predictionUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        console.error(`✗ Replicate poll error for ${requestId}: ${response.status}`);
        return null;
      }

      const prediction: ReplicatePrediction = await response.json();

      if (prediction.status === 'succeeded') {
        return prediction;
      }
      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        console.error(`✗ Replicate prediction ${prediction.status} for ${requestId}:`, prediction.error);
        return null;
      }
    }

    console.error(`✗ Replicate prediction timed out for ${requestId}`);
    return null;
  }

  private extractImageUrl(output: ReplicatePrediction['output']): string | null {
    if (!output) return null;
    if (typeof output === 'string') return output;
    if (Array.isArray(output) && output.length > 0) return output[0];
    return null;
  }

  async generateImage(prompt: string, requestId: string = 'image'): Promise<string | null> {
    if (!this.apiToken) {
      console.log('Replicate API token not configured, skipping image generation.');
      return null;
    }
    if (!prompt || prompt.trim() === '') {
      console.warn('Empty image prompt provided, skipping generation.');
      return null;
    }

    console.log(`Requesting Replicate FLUX Schnell image generation for prompt: "${prompt.substring(0, 100)}..."`);

    try {
      const response = await fetch(`${this.apiUrl}/models/black-forest-labs/flux-schnell/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
          'Prefer': 'wait'
        },
        body: JSON.stringify({
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'png',
            output_quality: 80
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`✗ Replicate API error for ${requestId}: ${response.status} ${response.statusText} - ${errorText}`);
        return null;
      }

      let prediction: ReplicatePrediction = await response.json();

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        console.error(`✗ Replicate prediction ${prediction.status} for ${requestId}:`, prediction.error);
        return null;
      }

      if (prediction.status === 'starting' || prediction.status === 'processing') {
        const pollUrl = prediction.urls?.get || `${this.apiUrl}/predictions/${prediction.id}`;
        console.log(`Prediction still ${prediction.status} for ${requestId}, polling...`);
        const polledPrediction = await this.pollPrediction(pollUrl, requestId);
        if (!polledPrediction) return null;
        prediction = polledPrediction;
      }

      const imageUrl = this.extractImageUrl(prediction.output);
      if (!imageUrl) {
        console.error(`✗ No image data in response for ${requestId}`);
        return null;
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(`✗ Failed to download generated image for ${requestId}: ${imageResponse.status}`);
        return null;
      }
      const buffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      console.log(`✓ Image generated successfully (${requestId})`);
      return base64;
    } catch (error: any) {
      console.error(`✗ Error generating image for ${requestId}:`, error.message);
      return null;
    }
  }

  async generateImagesBatch(prompts: string[], requestIds?: string[]): Promise<(string | null)[]> {
    if (!this.apiToken) {
      console.log('Replicate API token not configured, skipping batch image generation.');
      return prompts.map(() => null);
    }

    console.log(`Starting Replicate FLUX Schnell batch generation for ${prompts.length} images`);

    const results = await Promise.allSettled(
      prompts.map((prompt, index) => {
        const id = requestIds?.[index] ?? `batch_${index}`;
        return this.generateImage(prompt, id);
      })
    );

    const images = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      console.error(`✗ Batch image ${index} failed:`, result.reason);
      return null;
    });

    const successful = images.filter(r => r !== null).length;
    console.log(`✓ Replicate batch generation complete: ${successful}/${prompts.length} successful`);

    return images;
  }
}

export const replicateService = new ReplicateService(process.env.REPLICATE_API_TOKEN || '');
