export type AIProviderType = 'fal' | 'replicate' | 'openai' | 'stability';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxResolution?: { width: number; height: number };
}

export interface ImageGenerationOptions {
  width: number;
  height: number;
  model: string;
  negativePrompt?: string;
  steps?: number;
  seed?: number;
}

export interface GenerationRequest {
  provider: AIProviderType;
  prompt: string;
  options: ImageGenerationOptions;
}

export interface GenerationResult {
  imageUrl: string;
  provider: AIProviderType;
  model: string;
  prompt: string;
  timestamp: number;
  id: string;
}

export interface AIProviderConfig {
  type: AIProviderType;
  name: string;
  description: string;
  models: AIModel[];
  keyName: string; // e.g. "FAL_KEY"
  docsUrl: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    type: 'fal',
    name: 'fal.ai',
    description: 'Fast image generation with FLUX models',
    keyName: 'FAL_KEY',
    docsUrl: 'https://fal.ai/dashboard/keys',
    models: [
      { id: 'fal-ai/flux/schnell', name: 'FLUX.1 Schnell', description: 'Fast generation, good quality' },
      { id: 'fal-ai/flux/dev', name: 'FLUX.1 Dev', description: 'Higher quality, slower' },
    ],
  },
  {
    type: 'replicate',
    name: 'Replicate',
    description: 'Versatile model hosting platform',
    keyName: 'REPLICATE_API_TOKEN',
    docsUrl: 'https://replicate.com/account/api-tokens',
    models: [
      { id: 'stability-ai/sdxl', name: 'SDXL', description: 'Stable Diffusion XL' },
      { id: 'playgroundai/playground-v2.5-1024px-aesthetic', name: 'Playground v2.5', description: 'Aesthetic focused' },
    ],
  },
  {
    type: 'openai',
    name: 'OpenAI',
    description: 'DALL-E image generation',
    keyName: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'dall-e-3', name: 'DALL-E 3', description: 'Best for creative illustrations' },
    ],
  },
  {
    type: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion models',
    keyName: 'STABILITY_API_KEY',
    docsUrl: 'https://platform.stability.ai/account/keys',
    models: [
      { id: 'sd3-medium', name: 'SD3 Medium', description: 'Latest Stable Diffusion' },
    ],
  },
];

/** Separate config for audio API */
export const AUDIO_PROVIDER: AIProviderConfig = {
  type: 'fal' as AIProviderType, // unused but required by the interface
  name: 'Freesound',
  description: 'Free CC-licensed sounds for slideshow audio',
  keyName: 'FREESOUND_API_KEY',
  docsUrl: 'https://freesound.org/apiv2/apply',
  models: [],
};
