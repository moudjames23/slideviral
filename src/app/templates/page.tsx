'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { trendTemplates } from '@/lib/templates/registry';
import type { TemplateCategory } from '@/types';

const categories: { value: TemplateCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'pov', label: 'POV' },
  { value: 'list', label: 'List' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'story', label: 'Story' },
];

function ViralBadge({ score }: { score: number }) {
  const color =
    score >= 9
      ? 'bg-green-100 text-green-700'
      : score >= 7
        ? 'bg-amber-100 text-amber-700'
        : 'bg-zinc-100 text-zinc-600';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <Sparkles className="h-3 w-3" />
      {score}/10
    </span>
  );
}

export default function TemplatesPage() {
  const [filter, setFilter] = useState<TemplateCategory | 'all'>('all');

  const filtered =
    filter === 'all' ? trendTemplates : trendTemplates.filter((t) => t.category === filter);

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-12">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <LayoutGrid className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trend Templates</h1>
          <p className="text-sm text-muted-foreground">
            Proven viral formats. Pick one, customize it, add your app.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="group rounded-xl border border-border p-5 transition-all hover:border-primary/20 hover:shadow-sm"
          >
            {/* Preview area */}
            <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/50">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Eye className="h-6 w-6" />
                <span className="text-xs">{template.slides.length} slides</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold leading-snug">{template.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </div>
              <ViralBadge score={template.viralScore} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href={`/create?template=${template.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Use this template
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
