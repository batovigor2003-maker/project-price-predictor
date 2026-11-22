import type { TicketInput } from './demo-data';
import type { FlightLeg, ResultTicket } from './search-contract';

const faresUrl = 'https://ignav.com/api/fares';
const timeoutMs = 20_000;
const localTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
const millisecondsPerDay = 86_400_000;

type IgnavSegment = {
  marketing_carrier_code: string | null;
  operating_carrier_name: string | null;
  flight_number: string | null;
  departure_airport: string;
  departure_time_local: string;
  departure_time_utc: string | null;
  arrival_airport: string;
  arrival_time_local: string;
  arrival_time_utc: string | null;
  duration_minutes: number;
};

type IgnavLeg = { carrier?: string; duration_minutes?: number; segments: IgnavSegment[] };

type IgnavItinerary = {
  ignav_id: string;
  price: { amount: number; currency: string; status: 'verified' | 'unverified' };
  outbound: IgnavLeg;
  inbound?: IgnavLeg;
};

export class IgnavError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code?: string) {
    super('Ignav fare search failed');
    this.status = status;
    this.code = code;
  }
}

export function getIgnavApiKey() {
  return process.env.IGNAV_API_KEY?.trim();
}

function mapLeg(leg?: IgnavLeg): FlightLeg | null {
  if (!Array.isArray(leg?.segments)) return null;

  const first = leg.segments[0];
  const last = leg.segments.at(-1);
  if (!first || !last || !localTimePattern.test(first.departure_time_local) ||
    !localTimePattern.test(last.arrival_time_local) || !/^[A-Z]{3}$/.test(first.departure_airport) ||
    !/^[A-Z]{3}$/.test(last.arrival_airport)) return null;

  const departureDate = Date.parse(first.departure_time_local.slice(0, 10));
  const arrivalDate = Date.parse(last.arrival_time_local.slice(0, 10));
  if (!Number.isFinite(departureDate) || !Number.isFinite(arrivalDate)) return null;

  const stops = leg.segments.length - 1;
  const elapsedMinutes = (Date.parse(last.arrival_time_utc ?? '') - Date.parse(first.departure_time_utc ?? '')) / 60_000;
  const duration = leg.duration_minutes ?? (stops === 0 ? first.duration_minutes : elapsedMinutes);
  const code = leg.segments.every((segment) => segment?.marketing_carrier_code === first.marketing_carrier_code)
    ? first.marketing_carrier_code
    : null;

  return {
    airline: { code, name: leg.carrier || (code ? first.operating_carrier_name : null) || null },
    flightNumber: stops === 0 && first.flight_number ? [code, first.flight_number].filter(Boolean).join(' ') : null,
    departureAirport: first.departure_airport,
    departureTime: first.departure_time_local.slice(11, 16),
    arrivalAirport: last.arrival_airport,
    arrivalTime: last.arrival_time_local.slice(11, 16),
    arrivalDayOffset: (arrivalDate - departureDate) / millisecondsPerDay,
    durationMinutes: Number.isInteger(duration) && duration > 0 ? duration : null,
    stops,
  };
}

function mapItinerary(itinerary: IgnavItinerary, roundTrip: boolean): ResultTicket | null {
  const price = itinerary?.price;
  if (!itinerary?.ignav_id || !price || !Number.isFinite(price.amount) ||
    price.amount <= 0 || !/^[A-Z]{3}$/.test(price.currency)) return null;

  const outbound = mapLeg(itinerary.outbound);
  const inbound = roundTrip ? mapLeg(itinerary.inbound) : null;
  if (!outbound || (roundTrip && !inbound)) return null;

  return {
    id: itinerary.ignav_id,
    price: { amount: price.amount, currency: price.currency, approximate: price.status !== 'verified' },
    outbound,
    inbound,
  };
}

export async function searchIgnav(input: TicketInput, apiKey: string, signal: AbortSignal): Promise<ResultTicket[]> {
  const endpoint = input.returnDate ? 'round-trip' : 'one-way';
  const response = await fetch(`${faresUrl}/${endpoint}`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({
      origin: input.originCode,
      destination: input.destinationCode,
      departure_date: input.departureDate,
      ...(input.returnDate && { return_date: input.returnDate }),
      adults: input.adults,
      children: input.children,
      infants_on_lap: input.infants,
      cabin_class: input.cabinClass === 'comfort' ? 'premium_economy' : input.cabinClass,
      market: 'US',
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new IgnavError(response.status, payload?.error?.code ?? payload?.code);
  }
  const payload = await response.json();
  if (!Array.isArray(payload?.itineraries)) throw new IgnavError(502);

  const tickets = new Map<string, ResultTicket>();
  for (const itinerary of payload.itineraries) {
    const ticket = mapItinerary(itinerary, Boolean(input.returnDate));
    if (ticket && !tickets.has(ticket.id)) tickets.set(ticket.id, ticket);
  }
  const nonstop: ResultTicket[] = [];
  const connecting: ResultTicket[] = [];
  for (const ticket of tickets.values()) {
    const hasStops = ticket.outbound.stops > 0 || (ticket.inbound?.stops ?? 0) > 0;
    (hasStops ? connecting : nonstop).push(ticket);
  }
  return [...nonstop, ...connecting];
}
