import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = db
    .select({
      id: posts.id,
      accountId: posts.accountId,
      name: posts.name,
      slideshowData: posts.slideshowData,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      accountName: accounts.name,
    })
    .from(posts)
    .leftJoin(accounts, eq(posts.accountId, accounts.id))
    .where(eq(posts.id, id))
    .get();

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ...row,
    slideshowData: JSON.parse(row.slideshowData),
    accountName: row.accountName ?? 'Unknown',
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const existing = db.select().from(posts).where(eq(posts.id, id)).get();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.accountId !== undefined) updates.accountId = body.accountId;
  if (body.slideshowData !== undefined) updates.slideshowData = JSON.stringify(body.slideshowData);

  db.update(posts).set(updates).where(eq(posts.id, id)).run();

  return NextResponse.json({ updated: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.delete(posts).where(eq(posts.id, id)).run();
  return NextResponse.json({ deleted: true, id });
}
