import type { Ticket } from '@/db/schema';
import type { FlightLeg, ResultTicket, TicketForecast } from './search-contract';

type Airport = { code: string; utcOffset: number };
const airports: Record<string, Airport> = {
  MOW: { code: 'DME', utcOffset: 3 },
  LED: { code: 'LED', utcOffset: 3 },
  AER: { code: 'AER', utcOffset: 3 },
  KZN: { code: 'KZN', utcOffset: 3 },
  SVX: { code: 'SVX', utcOffset: 5 },
  OVB: { code: 'OVB', utcOffset: 7 },
  KGD: { code: 'KGD', utcOffset: 2 },
  VVO: { code: 'VVO', utcOffset: 10 },
  MRV: { code: 'MRV', utcOffset: 3 },
  UFA: { code: 'UFA', utcOffset: 5 },
};

const routeDurations: Record<string, number> = {
  'MOW-AER': 150, 'MOW-LED': 85, 'LED-KGD': 115, 'MOW-KZN': 95,
  'MOW-SVX': 140, 'LED-AER': 225, 'MOW-OVB': 245, 'MOW-VVO': 500,
  'KZN-MRV': 170, 'SVX-UFA': 70,
};

const options = [
  { airline: 'aeroflot', departure: 17 * 60 + 45, returnDeparture: 13 * 60 + 20, priceOffset: 0, durationOffset: 0, probability: 78 },
  { airline: 's7', departure: 8 * 60 + 20, returnDeparture: 10 * 60 + 5, priceOffset: 1060, durationOffset: 10, probability: 71 },
  { airline: 'ural', departure: 12 * 60 + 10, returnDeparture: 18 * 60 + 45, priceOffset: 2300, durationOffset: 5, probability: 64 },
] as const;

const directions = ['down', 'up', 'stable'] as const;

function localTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return [Math.floor(normalized / 60), normalized % 60].map((part) => String(part).padStart(2, '0')).join(':');
}

function flightLeg(from: Airport, to: Airport, departure: number, durationMinutes: number): FlightLeg {
  const arrival = departure + durationMinutes + (to.utcOffset - from.utcOffset) * 60;
  return {
    departureAirport: from.code,
    departureTime: localTime(departure),
    arrivalAirport: to.code,
    arrivalTime: localTime(arrival),
    arrivalDayOffset: Math.floor(arrival / 1440),
    durationMinutes,
  };
}

export function demoResults(base: Ticket, source: 'database' | 'demo') {
  const from = airports[base.originCode];
  const to = airports[base.destinationCode];
  const duration = routeDurations[`${base.originCode}-${base.destinationCode}`] ??
    routeDurations[`${base.destinationCode}-${base.originCode}`] ?? 150;
  const directionIndex = directions.findIndex((direction) => direction === base.direction);
  const hasForecast = directionIndex >= 0 && base.predictedPriceRub !== null && base.changePercent !== null && base.advice !== null;

  return options.map((option, index): { ticket: ResultTicket; forecast: TicketForecast | null } => {
    const durationMinutes = duration + option.durationOffset;
    return {
      ticket: {
        id: `${source}-${base.id}-${base.departureDate}-${option.airline}`,
        airline: option.airline,
        currentPriceRub: base.currentPriceRub + option.priceOffset,
        outbound: flightLeg(from, to, option.departure, durationMinutes),
        inbound: base.returnDate ? flightLeg(to, from, option.returnDeparture, durationMinutes) : null,
      },
      forecast: hasForecast ? {
        direction: directions[(directionIndex + index) % directions.length],
        probability: option.probability,
      } : null,
    };
  });
}
