import type { Ticket } from '@/db/schema';

export const cities = [
  { code: 'MOW', name: 'Москва' },
  { code: 'LED', name: 'Санкт-Петербург' },
  { code: 'AER', name: 'Сочи' },
  { code: 'KZN', name: 'Казань' },
  { code: 'SVX', name: 'Екатеринбург' },
  { code: 'OVB', name: 'Новосибирск' },
  { code: 'KGD', name: 'Калининград' },
  { code: 'VVO', name: 'Владивосток' },
  { code: 'MRV', name: 'Минеральные Воды' },
  { code: 'UFA', name: 'Уфа' },
];

const routes = [
  ['MOW', 'AER'], ['MOW', 'LED'], ['LED', 'KGD'], ['MOW', 'KZN'],
  ['MOW', 'SVX'], ['LED', 'AER'], ['MOW', 'OVB'], ['MOW', 'VVO'],
  ['KZN', 'MRV'], ['SVX', 'UFA'],
] as const;

export const cabinClasses = ['economy', 'comfort', 'business', 'first'] as const;
export type CabinClass = typeof cabinClasses[number];
export type TicketInput = Pick<Ticket, 'originCode' | 'destinationCode' | 'departureDate' | 'returnDate' | 'adults' | 'children' | 'infants' | 'cabinClass'>;

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dateAfter(days: number, now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export type ForecastTicket = Ticket & {
  predictedPriceRub: number;
  changePercent: number;
  direction: string;
  advice: string;
};

export function demoTickets(now = new Date()): ForecastTicket[] {
  return Array.from({ length: 100 }, (_, index) => {
    const routeIndex = Math.floor(index / 10);
    const dateIndex = index % 10;
    const [originCode, destinationCode] = routes[routeIndex];
    const departureDate = dateAfter(14 + dateIndex * 3, now);
    const returnDate = index % 4 === 0 ? dateAfter(21 + dateIndex * 3, now) : null;
    const adults = index % 7 === 0 ? 2 : 1;
    const children = index % 11 === 0 ? 1 : 0;
    const infants = index % 17 === 0 ? 1 : 0;
    const cabinClass = cabinClasses[index % 4];
    const currentPriceRub = Math.round((5700 + routeIndex * 2400 + dateIndex * 530 + (index % 4) * 4100 + (adults - 1) * 5200 + children * 3200 + (returnDate ? 4500 : 0)) / 10) * 10;
    const changePercent = ((index * 11 + routeIndex * 3) % 39) - 19;
    const direction = changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';
    return {
      id: index + 1, originCode, destinationCode, departureDate, returnDate,
      adults, children, infants, cabinClass, currentPriceRub,
      predictedPriceRub: Math.round(currentPriceRub * (1 + changePercent / 100) / 10) * 10,
      changePercent, direction,
      advice: direction === 'up' ? 'buy' : 'wait',
      createdAt: now,
    };
  });
}

export function matchesTicket(ticket: Ticket, input: TicketInput): boolean {
  return ticket.originCode === input.originCode && ticket.destinationCode === input.destinationCode &&
    ticket.departureDate === input.departureDate && ticket.returnDate === input.returnDate &&
    ticket.adults === input.adults && ticket.children === input.children && ticket.infants === input.infants &&
    ticket.cabinClass === input.cabinClass;
}

export function cityName(code: string): string {
  return cities.find((city) => city.code === code)?.name ?? code;
}
