'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutGrid, Download, Plus, Building2 } from 'lucide-react';
import { NewPostDialog } from '@/components/posts/NewPostDialog';

export function Header() {
  const pathname = usePathname();
  const isEditor = pathname === '/create' || pathname.startsWith('/create?');
  const [showNewPost, setShowNewPost] = useState(false);

  const navItems = [
    { href: '/templates', label: 'Templates', icon: LayoutGrid },
    { href: '/accounts', label: 'Accounts', icon: Building2 },
    { href: '/create', label: 'Editor', icon: Sparkles },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SlideViral</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Export button */}
            <button
              onClick={() => {
                if (isEditor) {
                  window.dispatchEvent(new CustomEvent('slideviral:toggle-export'));
                } else {
                  window.location.href = '/export';
                }
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setShowNewPost(true)}
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Post</span>
            </button>
          </nav>
        </div>
      </header>

      <NewPostDialog open={showNewPost} onClose={() => setShowNewPost(false)} />
    </>
  );
}
