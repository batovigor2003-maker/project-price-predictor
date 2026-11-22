import { NextResponse } from 'next/server';
import { readSearchInput } from '@/lib/search-input';
import type { FlightResponse } from '@/lib/search-contract';
import { getIgnavApiKey, IgnavError, searchIgnav } from '@/lib/ignav';
import { findDemoResults, listTickets } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listTickets());
}

export async function POST(request: Request) {
  const input = await readSearchInput(request);
  if (!input) return NextResponse.json({ code: 'invalid_search' }, { status: 400 });

  const apiKey = getIgnavApiKey();
  if (apiKey) {
    if (input.adults + input.children + input.infants > 9) {
      return NextResponse.json({ code: 'invalid_search' }, { status: 400 });
    }

    try {
      const tickets = await searchIgnav(input, apiKey, request.signal);
      return NextResponse.json({ source: 'ignav', tickets } satisfies FlightResponse);
    } catch (error) {
      if (error instanceof IgnavError && error.code === 'departure_date_in_past') {
        return NextResponse.json({ code: 'invalid_search' }, { status: 400 });
      }
      return NextResponse.json({ code: 'service_error' }, { status: 502 });
    }
  }

  const results = await findDemoResults(input);
  return NextResponse.json({ source: 'demo', tickets: results.map(({ ticket }) => ticket) } satisfies FlightResponse);
}
