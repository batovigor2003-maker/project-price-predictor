import { integer, pgTable, serial, text, date, timestamp } from 'drizzle-orm/pg-core';

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  originCode: text('origin_code').notNull(),
  destinationCode: text('destination_code').notNull(),
  departureDate: date('departure_date').notNull(),
  returnDate: date('return_date'),
  adults: integer('adults').notNull(),
  children: integer('children').notNull(),
  infants: integer('infants').notNull(),
  cabinClass: text('cabin_class').notNull(),
  currentPriceRub: integer('current_price_rub').notNull(),
  predictedPriceRub: integer('predicted_price_rub'),
  changePercent: integer('change_percent'),
  direction: text('direction'),
  advice: text('advice'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
