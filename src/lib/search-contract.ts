import type { Ticket } from '@/db/schema';
import type { ForecastTicket } from './demo-data';

export type Flight = Omit<Ticket, 'createdAt' | 'predictedPriceRub' | 'changePercent' | 'direction' | 'advice'>;
export type ForecastResult = Omit<ForecastTicket, 'createdAt'>;

export type FlightResponse = { tickets: Flight[] };
export type ForecastResponse =
  | { status: 'success'; ticket: ForecastResult }
  | { status: 'no_prediction' };

export function toFlight(ticket: Ticket): Flight {
  const { createdAt, predictedPriceRub, changePercent, direction, advice, ...flight } = ticket;
  return flight;
}
