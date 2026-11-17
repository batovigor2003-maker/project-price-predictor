import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let pool: Pool | undefined;

export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 2000, max: 2 });
  return drizzle(pool);
}
