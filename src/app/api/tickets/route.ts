import { NextResponse } from 'next/server';
import { readSearchInput } from '@/lib/search-input';
import { toFlight, type FlightResponse } from '@/lib/search-contract';
import { findTicket, listTickets } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await listTickets());
}

export async function POST(request: Request) {
  const input = await readSearchInput(request);
  if (!input) return NextResponse.json({ code: 'invalid_search' }, { status: 400 });

  const ticket = await findTicket(input);
  if (!ticket) return NextResponse.json({ tickets: [] } satisfies FlightResponse);

  return NextResponse.json({ tickets: [toFlight(ticket)] } satisfies FlightResponse);
}
