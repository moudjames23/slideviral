import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, accounts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  let query = db
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
    .orderBy(desc(posts.updatedAt));

  const rows = accountId
    ? query.where(eq(posts.accountId, accountId)).all()
    : query.all();

  // Parse slideshowData JSON for each row
  const parsed = rows.map((r) => ({
    ...r,
    slideshowData: JSON.parse(r.slideshowData),
    accountName: r.accountName ?? 'Unknown',
  }));

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accountId, name, slideshowData } = body;

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }

  // Verify account exists
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const now = Date.now();
  const defaultSlide = {
    id: generateId(),
    textOverlays: [],
    duration: 3,
    transition: 'fade',
    backgroundColor: '#000000',
    isAppPromo: false,
  };
  const defaultData = { slides: [defaultSlide], aspectRatio: '9:16' };
  const post = {
    id: body.id || generateId(),
    accountId,
    name: (name || 'Untitled Post').trim(),
    slideshowData: JSON.stringify(slideshowData || defaultData),
    createdAt: now,
    updatedAt: now,
  };

  db.insert(posts).values(post).run();

  return NextResponse.json(
    { ...post, slideshowData: JSON.parse(post.slideshowData), accountName: account.name },
    { status: 201 },
  );
}
