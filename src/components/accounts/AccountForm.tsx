'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Account } from '@/types';

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (account: Account) => void;
  editAccount?: Account | null; // null = create mode
}

export function AccountForm({ open, onClose, onSaved, editAccount }: AccountFormProps) {
  const isEdit = !!editAccount;
  const [name, setName] = useState(editAccount?.name ?? '');
  const [website, setWebsite] = useState(editAccount?.website ?? '');
  const [appStoreLink, setAppStoreLink] = useState(editAccount?.appStoreLink ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }

    setSaving(true);
    setError(null);
    try {
      const data = { name: name.trim(), website: website.trim() || undefined, appStoreLink: appStoreLink.trim() || undefined };
      const result = isEdit
        ? await api.accounts.update(editAccount!.id, data)
        : await api.accounts.create(data);
      onSaved(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">App / Brand Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SkinLens, Crohncare, Nixd..."
              autoFocus
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://skinlens.app"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">App Store Link</label>
            <input
              type="url"
              value={appStoreLink}
              onChange={(e) => setAppStoreLink(e.target.value)}
              placeholder="https://apps.apple.com/app/..."
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
