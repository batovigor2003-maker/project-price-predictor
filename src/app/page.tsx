import { listTickets } from '@/lib/ticket-service';
import { getIgnavApiKey } from '@/lib/ignav';
import { dateAfter } from '@/lib/demo-data';
import { toFlight } from '@/lib/search-contract';
import { FlightApp } from '@/components/flight-app';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { tickets } = await listTickets();
  const liveDepartureDate = getIgnavApiKey() ? dateAfter(14) : null;
  return <FlightApp tickets={tickets.map(toFlight)} liveDepartureDate={liveDepartureDate} />;
}
