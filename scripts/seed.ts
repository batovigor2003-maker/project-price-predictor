import 'dotenv/config';
import { getDb } from '../src/db/client';
import { tickets } from '../src/db/schema';
import { demoTickets } from '../src/lib/demo-data';
import { count } from 'drizzle-orm';

const db = getDb();
if (!db) throw new Error('DATABASE_URL is required');
const [{ value }] = await db.select({ value: count() }).from(tickets);
if (value > 0) throw new Error('Tickets table is not empty; seed only an empty database');
const rows = demoTickets().map(({ id: _id, createdAt: _createdAt, ...ticket }) => ticket);
await db.insert(tickets).values(rows);
console.log(`Seeded ${rows.length} demo tickets`);
process.exit(0);
