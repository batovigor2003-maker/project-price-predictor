import type { Ticket } from '@/db/schema';

export type Flight = Omit<Ticket, 'createdAt' | 'predictedPriceRub' | 'changePercent' | 'direction' | 'advice'>;
export type FlightLeg = {
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  arrivalDayOffset: number;
  durationMinutes: number;
};

export type ResultTicket = {
  id: string;
  currentPriceRub: number;
  airline: 'aeroflot' | 's7' | 'ural';
  outbound: FlightLeg;
  inbound: FlightLeg | null;
};

export type TicketForecast = {
  direction: 'up' | 'down' | 'stable';
  probability: number;
};

export type FlightResponse = { tickets: ResultTicket[] };
export type ForecastResponse = { forecasts: Record<string, TicketForecast> };

export function toFlight(ticket: Ticket): Flight {
  const { createdAt, predictedPriceRub, changePercent, direction, advice, ...flight } = ticket;
  return flight;
}
