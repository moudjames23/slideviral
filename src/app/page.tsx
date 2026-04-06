'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, LayoutGrid, Zap, ArrowRight, Trash2, Plus, Building2, Film } from 'lucide-react';
import { api } from '@/lib/api';
import { NewPostDialog } from '@/components/posts/NewPostDialog';
import type { Account, PostWithAccount } from '@/types';

export default function Home() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<PostWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostAccountId, setNewPostAccountId] = useState<string | undefined>();
  const [showNewPost, setShowNewPost] = useState(false);

  useEffect(() => {
    Promise.all([api.accounts.list(), api.posts.list()])
      .then(([a, p]) => { setAccounts(a); setPosts(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeletePost = async (id: string) => {
    try {
      await api.posts.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
  };

  // Group posts by account
  const groupedPosts = accounts.map((account) => ({
    account,
    posts: posts.filter((p) => p.accountId === account.id),
  }));

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Slideshows that sell
          <br />
          <span className="text-muted-foreground">without looking like ads</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Pick a viral trend, add your images, drop your app screenshot on the last slide.
          Export for TikTok, Reels, or Shorts in one click.
        </p>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Zap className="h-4 w-4" />
            New Post
          </button>
          <Link
            href="/templates"
            className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <LayoutGrid className="h-4 w-4" />
            Browse templates
          </Link>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-24 grid gap-6 sm:grid-cols-3"
      >
        {[
          { title: 'Trend templates', desc: '10+ viral patterns ready to customize. Just add your photos and app screenshot.', icon: LayoutGrid },
          { title: 'AI images', desc: 'Generate lifestyle backgrounds with fal.ai, Replicate, DALL-E, or Stability AI.', icon: Sparkles },
          { title: 'Multi-platform export', desc: 'One slideshow, every format. TikTok, Reels, Shorts, Twitter — all optimized.', icon: Zap },
        ].map(({ title, desc, icon: Icon }) => (
          <div key={title} className="rounded-xl border border-border p-6 transition-colors hover:border-primary/20 hover:bg-muted/50">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Posts by Account */}
      {!loading && groupedPosts.length > 0 && (
        <div className="mt-24">
          <h2 className="text-xl font-semibold mb-6">Your Posts</h2>
          <div className="space-y-8">
            {groupedPosts.map(({ account, posts: accountPosts }) => (
              <div key={account.id}>
                {/* Account header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{account.name}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {accountPosts.length} post{accountPosts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => { setNewPostAccountId(account.id); setShowNewPost(true); }}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3" />
                    New Post
                  </button>
                </div>

                {/* Posts grid */}
                {accountPosts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No posts yet for {account.name}.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {accountPosts.map((post) => (
                      <div
                        key={post.id}
                        className="group flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/20"
                      >
                        <Link href={`/create?post=${post.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Film className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <p className="font-medium truncate">{post.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.slideshowData?.slides?.length ?? 0} slides · {new Date(post.updatedAt).toLocaleDateString()}
                          </p>
                        </Link>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/create?post=${post.id}`}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && accounts.length === 0 && (
        <div className="mt-24 rounded-xl border border-dashed border-border p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No accounts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create an account for your app or brand to start making slideshows.
          </p>
          <Link
            href="/accounts"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" />
            Create Account
          </Link>
        </div>
      )}

      <NewPostDialog
        open={showNewPost}
        onClose={() => { setShowNewPost(false); setNewPostAccountId(undefined); }}
        preselectedAccountId={newPostAccountId}
      />
    </div>
  );
}
