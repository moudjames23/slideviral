'use client';

import type { Account, PostWithAccount, SlideshowData } from '@/types';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  accounts: {
    list: () => fetchJSON<Account[]>('/api/accounts'),

    get: (id: string) => fetchJSON<Account>(`/api/accounts/${id}`),

    create: (data: { name: string; website?: string; appStoreLink?: string }) =>
      fetchJSON<Account>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; website: string; appStoreLink: string }>) =>
      fetchJSON<Account>(`/api/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJSON<{ deleted: boolean; deletedPostIds: string[] }>(`/api/accounts/${id}`, {
        method: 'DELETE',
      }),
  },

  posts: {
    list: (accountId?: string) => {
      const url = accountId ? `/api/posts?accountId=${accountId}` : '/api/posts';
      return fetchJSON<PostWithAccount[]>(url);
    },

    get: (id: string) => fetchJSON<PostWithAccount>(`/api/posts/${id}`),

    create: (data: { accountId: string; name?: string; slideshowData?: SlideshowData; id?: string }) =>
      fetchJSON<PostWithAccount>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; accountId: string; slideshowData: SlideshowData }>) =>
      fetchJSON<{ updated: boolean }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJSON<{ deleted: boolean; id: string }>(`/api/posts/${id}`, {
        method: 'DELETE',
      }),
  },
};
