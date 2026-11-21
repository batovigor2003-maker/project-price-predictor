import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { tickets } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    if (!db) throw new Error('Database is not configured');
    await db.select({ ready: sql<number>`1` }).from(tickets).limit(1);
    return Response.json({ status: 'ok', sha: process.env.RELEASE_SHA ?? null });
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503 });
  }
}
