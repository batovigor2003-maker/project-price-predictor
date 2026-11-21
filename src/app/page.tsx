import { listTickets } from '@/lib/ticket-service';
import { toFlight } from '@/lib/search-contract';
import { FlightApp } from '@/components/flight-app';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { tickets } = await listTickets();
  return <FlightApp tickets={tickets.map(toFlight)} />;
}
