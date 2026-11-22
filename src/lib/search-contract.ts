import type { Ticket } from '@/db/schema';

export type Flight = Omit<Ticket, 'createdAt' | 'predictedPriceRub' | 'changePercent' | 'direction' | 'advice'>;
export type FlightSource = 'demo' | 'ignav';
export type FlightLeg = {
  airline: { code: string | null; name: string | null };
  flightNumber?: string | null;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  arrivalDayOffset: number;
  durationMinutes: number | null;
  stops: number;
};

export type ResultTicket = {
  id: string;
  price: { amount: number; currency: string; approximate: boolean };
  outbound: FlightLeg;
  inbound: FlightLeg | null;
};

export type TicketForecast = {
  direction: 'up' | 'down' | 'stable';
  probability: number;
};

export type FlightResponse = { source: FlightSource; tickets: ResultTicket[] };
export type ForecastResponse = { forecasts: Record<string, TicketForecast> };

export function toFlight(ticket: Ticket): Flight {
  const { createdAt, predictedPriceRub, changePercent, direction, advice, ...flight } = ticket;
  return flight;
}
