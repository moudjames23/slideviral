'use client';

import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { AI_PROVIDERS } from '@/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { apiKeys, setApiKey } = useSlideshowStore();
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Load keys from store on open
  useEffect(() => {
    if (open) {
      // Load from localStorage on mount
      try {
        const stored = localStorage.getItem('slideviral-api-keys');
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocalKeys(parsed);
          // Also update store
          Object.entries(parsed).forEach(([key, value]) => {
            setApiKey(key, value as string);
          });
        }
      } catch {
        // ignore
      }
      setLocalKeys({ ...apiKeys });
    }
  }, [open, apiKeys, setApiKey]);

  const handleSave = (keyName: string, value: string) => {
    setLocalKeys((prev) => ({ ...prev, [keyName]: value }));
    setApiKey(keyName, value);
  };

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">API Keys</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Your API keys are stored locally in your browser. They are never sent to our servers
            — only proxied to the provider APIs.
          </p>

          <div className="space-y-5">
            {AI_PROVIDERS.map((provider) => {
              const value = localKeys[provider.keyName] ?? '';
              const hasKey = !!value;
              const isVisible = visibleKeys[provider.keyName] ?? false;

              return (
                <div key={provider.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{provider.name}</label>
                      {hasKey && (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          <Check className="h-2.5 w-2.5" />
                          Connected
                        </span>
                      )}
                    </div>
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Get key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => handleSave(provider.keyName, e.target.value)}
                      placeholder={`Enter your ${provider.keyName}...`}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => toggleVisibility(provider.keyName)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
