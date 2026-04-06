import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = db.select().from(accounts).where(eq(accounts.id, id)).get();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const existing = db.select().from(accounts).where(eq(accounts.id, id)).get();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.website !== undefined) updates.website = body.website?.trim() || null;
  if (body.appStoreLink !== undefined) updates.appStoreLink = body.appStoreLink?.trim() || null;

  db.update(accounts).set(updates).where(eq(accounts.id, id)).run();

  const updated = db.select().from(accounts).where(eq(accounts.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Get post IDs before cascade delete (for client-side IndexedDB cleanup)
  const postRows = db.select({ id: posts.id }).from(posts).where(eq(posts.accountId, id)).all();
  const deletedPostIds = postRows.map((p) => p.id);

  db.delete(accounts).where(eq(accounts.id, id)).run();

  return NextResponse.json({ deleted: true, deletedPostIds });
}
