'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, Pencil, Trash2, Globe, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { AccountForm } from '@/components/accounts/AccountForm';
import type { Account } from '@/types';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.accounts.list();
      setAccounts(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account and all its posts?')) return;
    try {
      await api.accounts.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
            <p className="text-sm text-muted-foreground">
              Apps and brands you promote with slideshows.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditAccount(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Account
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No accounts yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Create your first account to start making slideshows.
          </p>
          <button
            onClick={() => { setEditAccount(null); setShowForm(true); }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" />
            Create Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group rounded-xl border border-border p-5 transition-colors hover:border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{account.name}</h3>
                  {account.website && (
                    <a
                      href={account.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      {account.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {account.appStoreLink && (
                    <a
                      href={account.appStoreLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      App Store
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditAccount(account); setShowForm(true); }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Created {new Date(account.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <AccountForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { loadAccounts(); }}
        editAccount={editAccount}
      />
    </div>
  );
}
