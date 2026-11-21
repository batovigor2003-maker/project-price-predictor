import { cabinClasses, cities, type TicketInput } from './demo-data';

export async function readSearchInput(request: Request): Promise<TicketInput | null> {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const values = body as Record<string, unknown>;
  const input: TicketInput = {
    originCode: String(values.originCode ?? ''),
    destinationCode: String(values.destinationCode ?? ''),
    departureDate: String(values.departureDate ?? ''),
    returnDate: values.returnDate ? String(values.returnDate) : null,
    adults: Number(values.adults),
    children: Number(values.children),
    infants: Number(values.infants),
    cabinClass: String(values.cabinClass ?? ''),
  };

  const codes = cities.map((city) => city.code);
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  const validCount = (value: number, min: number) => Number.isInteger(value) && value >= min && value <= 9;
  if (!codes.includes(input.originCode) || !codes.includes(input.destinationCode) || input.originCode === input.destinationCode ||
    !validDate(input.departureDate) || (input.returnDate !== null && (!validDate(input.returnDate) || input.returnDate < input.departureDate)) ||
    !validCount(input.adults, 1) || !validCount(input.children, 0) || !validCount(input.infants, 0) ||
    input.infants > input.adults || !cabinClasses.some((value) => value === input.cabinClass)) {
    return null;
  }
  return input;
}
