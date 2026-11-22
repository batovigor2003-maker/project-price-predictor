import assert from 'node:assert/strict';
import test from 'node:test';
import { searchIgnav } from '../src/lib/ignav.ts';

const input = {
  originCode: 'MOW',
  destinationCode: 'OVB',
  departureDate: '2026-12-13',
  returnDate: null,
  adults: 2,
  children: 1,
  infants: 1,
  cabinClass: 'comfort',
};

const directLeg = {
  carrier: 'S7',
  segments: [{
    marketing_carrier_code: 'S7',
    flight_number: '2515',
    departure_airport: 'DME',
    departure_time_local: '2026-12-13T22:00:00',
    arrival_airport: 'OVB',
    arrival_time_local: '2026-12-14T06:10:00',
    duration_minutes: 250,
  }],
};
const connection = {
  carrier: 'Multiple airlines',
  segments: [
    { ...directLeg.segments[0], arrival_airport: 'KZN', departure_time_utc: '2026-12-13T19:00:00Z' },
    { ...directLeg.segments[0], departure_airport: 'KZN', marketing_carrier_code: 'UT', arrival_time_local: '2026-12-14T09:00:00', arrival_time_utc: '2026-12-14T02:00:00Z' },
  ],
};
const itinerary = {
  ignav_id: 'direct',
  price: { amount: 118.5, currency: 'USD', status: 'unverified' },
  outbound: directLeg,
};

test('one-way search requests US fares and ranks nonstop flights before connections', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string, request: RequestInit) => {
    assert.equal(url, 'https://ignav.com/api/fares/one-way');
    assert.equal(new Headers(request.headers).get('X-Api-Key'), 'test-key');
    assert.deepEqual(JSON.parse(String(request.body)), {
      origin: 'MOW',
      destination: 'OVB',
      departure_date: '2026-12-13',
      adults: 2,
      children: 1,
      infants_on_lap: 1,
      cabin_class: 'premium_economy',
      market: 'US',
    });
    return Response.json({
      itineraries: [
        { ...itinerary, ignav_id: 'connection', outbound: connection },
        itinerary,
        { ...itinerary, ignav_id: 'another-connection', outbound: connection },
      ],
    });
  });

  const tickets = await searchIgnav(input, 'test-key', new AbortController().signal);
  assert.deepEqual(tickets.map(({ id }) => id), ['direct', 'connection', 'another-connection']);
  const [ticket, connecting] = tickets;
  assert.equal(connecting.outbound.stops, 1);
  assert.equal(connecting.outbound.flightNumber, null);
  assert.equal(connecting.outbound.departureAirport, 'DME');
  assert.equal(connecting.outbound.arrivalAirport, 'OVB');
  assert.equal(connecting.outbound.arrivalTime, '09:00');
  assert.equal(connecting.outbound.durationMinutes, 420);
  assert.deepEqual(ticket.price, { amount: 118.5, currency: 'USD', approximate: true });
  assert.deepEqual(ticket.outbound, {
    airline: { code: 'S7', name: 'S7' },
    flightNumber: 'S7 2515',
    departureAirport: 'DME',
    departureTime: '22:00',
    arrivalAirport: 'OVB',
    arrivalTime: '06:10',
    arrivalDayOffset: 1,
    durationMinutes: 250,
    stops: 0,
  });
  assert.equal(ticket.inbound, null);
});

test('round trips with a connection in either direction follow fully nonstop options', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string, request: RequestInit) => {
    assert.equal(url, 'https://ignav.com/api/fares/round-trip');
    assert.equal(JSON.parse(String(request.body)).return_date, '2026-12-20');
    assert.equal('max_stops' in JSON.parse(String(request.body)), false);
    return Response.json({
      itineraries: [
        { ...itinerary, ignav_id: 'missing-return' },
        { ...itinerary, ignav_id: 'connected-return', inbound: connection },
        { ...itinerary, ignav_id: 'connected-outbound', outbound: connection, inbound: directLeg },
        { ...itinerary, inbound: { ...directLeg, carrier: 'UTair' } },
      ],
    });
  });

  const tickets = await searchIgnav({ ...input, returnDate: '2026-12-20' }, 'test-key', new AbortController().signal);
  assert.deepEqual(tickets.map(({ id }) => id), ['direct', 'connected-return', 'connected-outbound']);
  assert.equal(tickets[0].inbound?.airline.name, 'UTair');
});

test('empty provider results stay empty and provider failures are reported separately', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ itineraries: [] }), { times: 1 });
  const search = () => searchIgnav(input, 'test-key', new AbortController().signal);
  assert.deepEqual(await search(), []);
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { code: 'unable_to_complete_request' },
  }, { status: 424 }));
  await assert.rejects(search, { status: 424, code: 'unable_to_complete_request' });
});
