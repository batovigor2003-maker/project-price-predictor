import { NextResponse } from 'next/server';
import { readSearchInput } from '@/lib/search-input';
import { findTicket } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const input = await readSearchInput(request);
  if (!input) return NextResponse.json({ code: 'invalid_search' }, { status: 400 });

  const ticket = await findTicket(input);
  if (!ticket) return NextResponse.json({ code: 'ticket_not_found' }, { status: 404 });

  const fields = [ticket.predictedPriceRub, ticket.changePercent, ticket.direction, ticket.advice];
  if (fields.every((value) => value === null)) return NextResponse.json({ status: 'no_prediction' });
  if (fields.some((value) => value === null)) return NextResponse.json({ code: 'forecast_unavailable' }, { status: 500 });

  return NextResponse.json({ status: 'success', ticket, demo: true, horizonDays: 7, stableThresholdPercent: 5 });
}
