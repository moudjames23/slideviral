import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  const rows = db.select().from(accounts).orderBy(desc(accounts.updatedAt)).all();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, website, appStoreLink } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const now = Date.now();
  const account = {
    id: body.id || generateId(),
    name: name.trim(),
    website: website?.trim() || null,
    appStoreLink: appStoreLink?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(accounts).values(account).run();
  return NextResponse.json(account, { status: 201 });
}
