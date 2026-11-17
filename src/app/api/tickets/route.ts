import { NextResponse } from 'next/server';
import { listTickets } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listTickets());
}
