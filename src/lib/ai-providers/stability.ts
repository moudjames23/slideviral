import type { ImageGenerationOptions, GenerationResult } from '@/types';
import type { AIImageProvider } from './index';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const stabilityProvider: AIImageProvider = {
  type: 'stability',

  async generate(prompt: string, apiKey: string, options: ImageGenerationOptions): Promise<GenerationResult> {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'stability',
        apiKey,
        prompt,
        model: options.model || 'sd3-medium',
        width: options.width,
        height: options.height,
        negative_prompt: options.negativePrompt,
        steps: options.steps || 30,
        seed: options.seed,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Stability AI error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: generateId(),
      imageUrl: data.imageUrl,
      provider: 'stability',
      model: options.model || 'sd3-medium',
      prompt,
      timestamp: Date.now(),
    };
  },
};
