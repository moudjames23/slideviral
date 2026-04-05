import type { ImageGenerationOptions, GenerationResult } from '@/types';
import type { AIImageProvider } from './index';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const openaiProvider: AIImageProvider = {
  type: 'openai',

  async generate(prompt: string, apiKey: string, options: ImageGenerationOptions): Promise<GenerationResult> {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'openai',
        apiKey,
        prompt,
        model: options.model || 'dall-e-3',
        width: options.width,
        height: options.height,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `OpenAI error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: generateId(),
      imageUrl: data.imageUrl,
      provider: 'openai',
      model: options.model || 'dall-e-3',
      prompt,
      timestamp: Date.now(),
    };
  },
};
