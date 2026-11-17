import { NextRequest, NextResponse } from 'next/server';
import { cabinClasses, cities, type TicketInput } from '@/lib/demo-data';
import { findTicket } from '@/lib/ticket-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Некорректный запрос.' }, { status: 400 }); }
  const input: TicketInput = {
    originCode: String(body.originCode ?? ''), destinationCode: String(body.destinationCode ?? ''),
    departureDate: String(body.departureDate ?? ''), returnDate: body.returnDate ? String(body.returnDate) : null,
    adults: Number(body.adults), children: Number(body.children), infants: Number(body.infants),
    cabinClass: String(body.cabinClass ?? ''),
  };
  const codes = cities.map((city) => city.code);
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  const validCount = (value: number, min: number) => Number.isInteger(value) && value >= min && value <= 9;
  if (!codes.includes(input.originCode) || !codes.includes(input.destinationCode) || input.originCode === input.destinationCode ||
    !validDate(input.departureDate) || (input.returnDate !== null && (!validDate(input.returnDate) || input.returnDate < input.departureDate)) ||
    !validCount(input.adults, 1) || !validCount(input.children, 0) || !validCount(input.infants, 0) ||
    input.infants > input.adults || !cabinClasses.includes(input.cabinClass as typeof cabinClasses[number])) {
    return NextResponse.json({ error: 'Проверьте маршрут, даты и пассажиров.' }, { status: 400 });
  }
  const ticket = await findTicket(input);
  if (!ticket) return NextResponse.json({ error: 'Для такого билета пока нет тестового прогноза. Выберите вариант из каталога ниже.' }, { status: 404 });
  return NextResponse.json({ ticket, demo: true, horizonDays: 7, stableThresholdPercent: 5 });
}
