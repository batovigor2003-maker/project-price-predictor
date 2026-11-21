import { NextResponse } from 'next/server';
import { readSearchInput } from '@/lib/search-input';
import type { ForecastResponse } from '@/lib/search-contract';
import { findDemoResults } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const input = await readSearchInput(request);
  if (!input) return NextResponse.json({ code: 'invalid_search' }, { status: 400 });

  const results = await findDemoResults(input);
  if (!results.length) return NextResponse.json({ code: 'ticket_not_found' }, { status: 404 });
  const forecasts = Object.fromEntries(results.flatMap(({ ticket, forecast }) => forecast ? [[ticket.id, forecast]] : []));
  return NextResponse.json({ forecasts } satisfies ForecastResponse);
}
