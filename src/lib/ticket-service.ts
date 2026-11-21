import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { tickets, type Ticket } from '@/db/schema';
import { demoTickets, matchesTicket, type TicketInput } from './demo-data';

export async function listTickets(): Promise<{ tickets: Ticket[]; source: 'database' | 'demo' }> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.select().from(tickets).orderBy(tickets.id);
      if (rows.length) return { tickets: rows, source: 'database' };
    } catch {
      // The demo catalog remains available when PostgreSQL is offline or not migrated.
    }
  }
  return { tickets: demoTickets(), source: 'demo' };
}

export async function findTicket(input: TicketInput): Promise<Ticket | null> {
  const db = getDb();
  const demoTicket = demoTickets().find((ticket) => matchesTicket(ticket, input)) ?? null;
  if (db) {
    try {
      const rows = await db.select().from(tickets).where(and(
        eq(tickets.originCode, input.originCode), eq(tickets.destinationCode, input.destinationCode),
        eq(tickets.departureDate, input.departureDate),
        input.returnDate === null ? isNull(tickets.returnDate) : eq(tickets.returnDate, input.returnDate),
        eq(tickets.adults, input.adults), eq(tickets.children, input.children),
        eq(tickets.infants, input.infants), eq(tickets.cabinClass, input.cabinClass),
      )).limit(1);
      if (rows[0]) return rows[0];
    } catch (error) {
      if (!demoTicket) throw error;
    }
  }
  return demoTicket;
}
