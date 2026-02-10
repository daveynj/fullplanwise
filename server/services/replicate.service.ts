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
  private maxRetries = 3;
  private concurrencyLimit = 4;

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

    for (let retry = 0; retry <= this.maxRetries; retry++) {
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

        if (response.status === 429) {
          const errorBody = await response.text();
          let retryAfter = 6;
          try {
            const parsed = JSON.parse(errorBody);
            if (parsed.retry_after) {
              retryAfter = parsed.retry_after;
            }
          } catch {}

          if (retry < this.maxRetries) {
            const waitTime = retryAfter * 1000 + (retry * 2000);
            console.log(`⏳ Rate limited for ${requestId}, waiting ${waitTime / 1000}s before retry ${retry + 1}/${this.maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          console.error(`✗ Replicate rate limit exceeded for ${requestId} after ${this.maxRetries} retries`);
          return null;
        }

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
        if (retry < this.maxRetries) {
          console.warn(`⏳ Error for ${requestId}, retrying (${retry + 1}/${this.maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, 3000 * (retry + 1)));
          continue;
        }
        console.error(`✗ Error generating image for ${requestId}:`, error.message);
        return null;
      }
    }

    return null;
  }

  async generateImagesBatch(prompts: string[], requestIds?: string[]): Promise<(string | null)[]> {
    if (!this.apiToken) {
      console.log('Replicate API token not configured, skipping batch image generation.');
      return prompts.map(() => null);
    }

    console.log(`Starting Replicate FLUX Schnell batch generation for ${prompts.length} images (concurrency: ${this.concurrencyLimit})`);

    const results: (string | null)[] = new Array(prompts.length).fill(null);
    const queue = prompts.map((prompt, index) => ({
      prompt,
      index,
      id: requestIds?.[index] ?? `batch_${index}`
    }));

    let cursor = 0;
    const runNext = async (): Promise<void> => {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        results[item.index] = await this.generateImage(item.prompt, item.id);
      }
    };

    const workers = Array.from(
      { length: Math.min(this.concurrencyLimit, queue.length) },
      () => runNext()
    );
    await Promise.all(workers);

    const successful = results.filter(r => r !== null).length;
    console.log(`✓ Replicate batch generation complete: ${successful}/${prompts.length} successful`);

    return results;
  }
}

export const replicateService = new ReplicateService(process.env.REPLICATE_API_TOKEN || '');
