import type { AIProviderType, ImageGenerationOptions, GenerationResult } from '@/types';

export interface AIImageProvider {
  type: AIProviderType;
  generate(prompt: string, apiKey: string, options: ImageGenerationOptions): Promise<GenerationResult>;
}

export { falProvider } from './fal';
export { replicateProvider } from './replicate';
export { openaiProvider } from './openai';
export { stabilityProvider } from './stability';

import { falProvider } from './fal';
import { replicateProvider } from './replicate';
import { openaiProvider } from './openai';
import { stabilityProvider } from './stability';

export const providers: Record<AIProviderType, AIImageProvider> = {
  fal: falProvider,
  replicate: replicateProvider,
  openai: openaiProvider,
  stability: stabilityProvider,
};

export function getProvider(type: AIProviderType): AIImageProvider {
  return providers[type];
}
