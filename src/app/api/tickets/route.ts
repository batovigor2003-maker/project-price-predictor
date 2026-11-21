import { NextResponse } from 'next/server';
import { readSearchInput } from '@/lib/search-input';
import type { FlightResponse } from '@/lib/search-contract';
import { findDemoResults, listTickets } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listTickets());
}

export async function POST(request: Request) {
  const input = await readSearchInput(request);
  if (!input) return NextResponse.json({ code: 'invalid_search' }, { status: 400 });

  const results = await findDemoResults(input);
  return NextResponse.json({ tickets: results.map(({ ticket }) => ticket) } satisfies FlightResponse);
}
