'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, LayoutGrid, Zap, ArrowRight, Trash2 } from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';

export default function Home() {
  const { savedProjects, loadProjectList, deleteProject } = useSlideshowStore();

  useEffect(() => {
    loadProjectList();
  }, [loadProjectList]);

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
          <Link
            href="/create"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Zap className="h-4 w-4" />
            Start creating
          </Link>
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
          {
            title: 'Trend templates',
            desc: '10+ viral patterns ready to customize. Just add your photos and app screenshot.',
            icon: LayoutGrid,
          },
          {
            title: 'AI images',
            desc: 'Generate lifestyle backgrounds with fal.ai, Replicate, DALL-E, or Stability AI.',
            icon: Sparkles,
          },
          {
            title: 'Multi-platform export',
            desc: 'One slideshow, every format. TikTok, Reels, Shorts, Twitter — all optimized.',
            icon: Zap,
          },
        ].map(({ title, desc, icon: Icon }) => (
          <div
            key={title}
            className="rounded-xl border border-border p-6 transition-colors hover:border-primary/20 hover:bg-muted/50"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Saved Projects */}
      {savedProjects.length > 0 && (
        <div className="mt-24">
          <h2 className="text-xl font-semibold">Your projects</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/20"
              >
                <Link href={`/create?project=${project.id}`} className="flex-1">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/create?project=${project.id}`}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
