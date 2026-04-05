'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  Wand2,
  ChevronDown,
  ImageIcon,
  Check,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { getProvider } from '@/lib/ai-providers';
import { AI_PROVIDERS, ASPECT_RATIOS } from '@/types';
import type { AIProviderType } from '@/types';

interface AIImageGeneratorProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function AIImageGenerator({ open, onClose, onOpenSettings }: AIImageGeneratorProps) {
  const { slideshow, activeSlideIndex, updateSlide, aiProvider, setAiProvider, apiKeys } =
    useSlideshowStore();

  const activeSlide = slideshow.slides[activeSlideIndex];
  const activeTemplate = useSlideshowStore((s) => s.activeTemplate);
  const templateSlide = activeTemplate?.slides[activeSlideIndex];

  const ratio = ASPECT_RATIOS[slideshow.aspectRatio];
  const providerConfig = AI_PROVIDERS.find((p) => p.type === aiProvider);
  const currentKey = apiKeys[providerConfig?.keyName ?? ''];

  const [prompt, setPrompt] = useState(templateSlide?.suggestedImagePrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(providerConfig?.models[0]?.id ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !currentKey) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedUrl(null);

    try {
      const provider = getProvider(aiProvider);
      const result = await provider.generate(prompt, currentKey, {
        model: selectedModel,
        width: ratio.width,
        height: ratio.height,
      });
      setGeneratedUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, currentKey, aiProvider, selectedModel, ratio]);

  const handleInsert = useCallback(() => {
    if (generatedUrl && activeSlide) {
      updateSlide(activeSlideIndex, { imageUrl: generatedUrl });
      onClose();
    }
  }, [generatedUrl, activeSlide, activeSlideIndex, updateSlide, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Generate Image</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Provider selector */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1">
              <button
                onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {providerConfig?.name ?? 'Select provider'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {showProviderDropdown && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-card shadow-lg">
                  {AI_PROVIDERS.map((p) => {
                    const hasKey = !!apiKeys[p.keyName];
                    return (
                      <button
                        key={p.type}
                        onClick={() => {
                          setAiProvider(p.type as AIProviderType);
                          setSelectedModel(p.models[0]?.id ?? '');
                          setShowProviderDropdown(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasKey ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Check className="h-3 w-3" /> Key set
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No key</span>
                          )}
                          {aiProvider === p.type && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Model selector */}
            {providerConfig && providerConfig.models.length > 1 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              >
                {providerConfig.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* API key warning */}
          {!currentKey && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  API key required
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/80">
                  Add your {providerConfig?.name} API key to start generating images.
                </p>
                <button
                  onClick={onOpenSettings}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline"
                >
                  <Settings className="h-3 w-3" />
                  Open Settings
                </button>
              </div>
            </div>
          )}

          {/* Prompt input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {templateSlide?.suggestedImagePrompt && prompt !== templateSlide.suggestedImagePrompt && (
              <button
                onClick={() => setPrompt(templateSlide.suggestedImagePrompt)}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Use template suggestion
              </button>
            )}
          </div>

          {/* Result area */}
          <div className="mb-5 flex aspect-[3/4] max-h-72 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Generating with {providerConfig?.name}...</p>
              </div>
            ) : generatedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={generatedUrl}
                alt="Generated"
                className="h-full w-full object-contain"
              />
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-30" />
                <p className="text-sm">Generated image will appear here</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            {generatedUrl ? (
              <button
                onClick={handleInsert}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                Use this image
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !currentKey}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Generate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
