import { listTickets } from '@/lib/ticket-service';
import { FlightApp } from '@/components/flight-app';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { tickets, source } = await listTickets();
  return <FlightApp tickets={tickets.map(({ createdAt, ...ticket }) => ticket)} source={source} />;
}
