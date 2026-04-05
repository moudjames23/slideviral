import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, prompt, model, width, height, ...extra } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let imageUrl: string;

    switch (provider) {
      case 'fal':
        imageUrl = await generateWithFal(apiKey, prompt, model, width, height, extra);
        break;
      case 'replicate':
        imageUrl = await generateWithReplicate(apiKey, prompt, model, width, height, extra);
        break;
      case 'openai':
        imageUrl = await generateWithOpenAI(apiKey, prompt, model, width, height);
        break;
      case 'stability':
        imageUrl = await generateWithStability(apiKey, prompt, model, width, height, extra);
        break;
      default:
        return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- fal.ai ---
async function generateWithFal(
  apiKey: string,
  prompt: string,
  model: string,
  width: number,
  height: number,
  extra: Record<string, unknown>,
): Promise<string> {
  const response = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: width || 768, height: height || 1344 },
      num_inference_steps: (extra.num_inference_steps as number) || 4,
      seed: extra.seed || undefined,
      num_images: 1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`fal.ai error: ${err}`);
  }

  const data = await response.json();
  // fal returns { images: [{ url, ... }] }
  if (data.images?.[0]?.url) return data.images[0].url;
  throw new Error('No image returned from fal.ai');
}

// --- Replicate ---
async function generateWithReplicate(
  apiKey: string,
  prompt: string,
  model: string,
  width: number,
  height: number,
  extra: Record<string, unknown>,
): Promise<string> {
  // Create prediction
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: {
        prompt,
        width: width || 768,
        height: height || 1344,
        negative_prompt: extra.negative_prompt || '',
        num_inference_steps: (extra.num_inference_steps as number) || 30,
        seed: extra.seed || undefined,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate error: ${err}`);
  }

  const prediction = await createRes.json();

  // Poll for completion
  let result = prediction;
  let attempts = 0;
  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 60) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    result = await pollRes.json();
    attempts++;
  }

  if (result.status === 'failed') {
    throw new Error(`Replicate prediction failed: ${result.error || 'unknown'}`);
  }

  const output = result.output;
  if (Array.isArray(output) && output.length > 0) return output[0];
  if (typeof output === 'string') return output;
  throw new Error('No image returned from Replicate');
}

// --- OpenAI ---
async function generateWithOpenAI(
  apiKey: string,
  prompt: string,
  model: string,
  width: number,
  height: number,
): Promise<string> {
  // Map dimensions to DALL-E sizes
  let size = '1024x1792'; // vertical default
  if (width > height) size = '1792x1024';
  else if (width === height) size = '1024x1024';

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await response.json();
  if (data.data?.[0]?.url) return data.data[0].url;
  throw new Error('No image returned from OpenAI');
}

// --- Stability AI ---
async function generateWithStability(
  apiKey: string,
  prompt: string,
  model: string,
  width: number,
  height: number,
  extra: Record<string, unknown>,
): Promise<string> {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');
  if (extra.negative_prompt) formData.append('negative_prompt', extra.negative_prompt as string);
  if (extra.seed) formData.append('seed', String(extra.seed));

  // Snap to supported aspect ratio
  const aspectRatio = width < height ? '9:16' : width > height ? '16:9' : '1:1';
  formData.append('aspect_ratio', aspectRatio);

  const endpoint = model === 'sd3-medium'
    ? 'https://api.stability.ai/v2beta/stable-image/generate/sd3'
    : 'https://api.stability.ai/v2beta/stable-image/generate/core';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stability AI error: ${err}`);
  }

  const data = await response.json();
  if (data.image) {
    // Base64 encoded image
    return `data:image/png;base64,${data.image}`;
  }
  throw new Error('No image returned from Stability AI');
}
