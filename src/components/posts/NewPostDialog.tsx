'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { AccountForm } from '@/components/accounts/AccountForm';
import type { Account } from '@/types';

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedAccountId?: string;
  templateId?: string;
}

export function NewPostDialog({ open, onClose, preselectedAccountId, templateId }: NewPostDialogProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(preselectedAccountId ?? '');
  const [postName, setPostName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    api.accounts.list().then((data) => {
      setAccounts(data);
      if (preselectedAccountId) setSelectedAccountId(preselectedAccountId);
      else if (data.length === 1) setSelectedAccountId(data[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, preselectedAccountId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) { setError('Select an account'); return; }

    setCreating(true);
    setError(null);
    try {
      const post = await api.posts.create({
        accountId: selectedAccountId,
        name: postName.trim() || 'Untitled Post',
      });
      onClose();
      const url = templateId
        ? `/create?post=${post.id}&template=${templateId}`
        : `/create?post=${post.id}`;
      router.push(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl mx-4">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">New Post</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-4">
            {/* Account selector */}
            <div>
              <label className="text-sm font-medium">Account *</label>
              {loading ? (
                <div className="mt-1 h-10 rounded-lg bg-muted animate-pulse" />
              ) : accounts.length === 0 ? (
                <div className="mt-1 rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-sm text-muted-foreground">No accounts yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowNewAccount(true)}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Create your first account
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex gap-2">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select an account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewAccount(true)}
                    className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Create new account"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Post name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Post Name</label>
              <input
                type="text"
                value={postName}
                onChange={(e) => setPostName(e.target.value)}
                placeholder="Untitled Post"
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
                disabled={creating || !selectedAccountId}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Post
              </button>
            </div>
          </form>
        </div>
      </div>

      <AccountForm
        open={showNewAccount}
        onClose={() => setShowNewAccount(false)}
        onSaved={(account) => {
          setAccounts((prev) => [...prev, account]);
          setSelectedAccountId(account.id);
          setShowNewAccount(false);
        }}
      />
    </>
  );
}
