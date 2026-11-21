import assert from 'node:assert/strict';
import test from 'node:test';
import { demoTickets, matchesTicket } from '../src/lib/demo-data.ts';
import { demoResults } from '../src/lib/demo-results.ts';

test('demo catalog contains 100 distinct tickets and every forecast state', () => {
  const tickets = demoTickets(new Date('2026-11-17T12:00:00Z'));
  assert.equal(tickets.length, 100);
  assert.equal(new Set(tickets.map((ticket) => ticket.id)).size, 100);
  assert.deepEqual(new Set(tickets.map((ticket) => ticket.direction)), new Set(['up', 'down', 'stable']));
  for (const ticket of tickets) {
    assert.equal(ticket.direction, ticket.changePercent > 5 ? 'up' : ticket.changePercent < -5 ? 'down' : 'stable');
    assert.equal(ticket.advice, ticket.direction === 'up' ? 'buy' : 'wait');
    assert.ok(ticket.currentPriceRub > 0);
    assert.ok(ticket.predictedPriceRub > 0);
  }
});

test('lookup requires an exact route and passenger match', () => {
  const tickets = demoTickets(new Date('2026-11-17T12:00:00Z'));
  const ticket = tickets[0];
  assert.ok(matchesTicket(ticket, ticket));
  assert.equal(matchesTicket(ticket, { ...ticket, adults: ticket.adults + 1 }), false);
});

test('each search scenario has distinct flight options with stable forecast keys', () => {
  const baseTickets = demoTickets(new Date('2026-11-17T12:00:00Z'));
  for (const base of baseTickets) {
    const results = demoResults(base, 'demo');
    assert.equal(results.length, 3);
    assert.deepEqual(results, demoResults(base, 'demo'));
    assert.equal(new Set(results.map(({ ticket }) => ticket.id)).size, 3);
    assert.equal(new Set(results.map(({ ticket }) => ticket.currentPriceRub)).size, 3);
    assert.deepEqual(new Set(results.map(({ forecast }) => forecast?.direction)), new Set(['down', 'up', 'stable']));
    for (const { ticket } of results) {
      assert.equal(Boolean(ticket.inbound), Boolean(base.returnDate));
      if (ticket.inbound) {
        assert.equal(ticket.inbound.departureAirport, ticket.outbound.arrivalAirport);
        assert.equal(ticket.inbound.arrivalAirport, ticket.outbound.departureAirport);
      }
    }
  }
});

test('demo options remain available when a stored scenario has no forecast', () => {
  const [base] = demoTickets(new Date('2026-11-17T12:00:00Z'));
  const results = demoResults({
    ...base, predictedPriceRub: null, changePercent: null, direction: null, advice: null,
  }, 'database');
  assert.equal(results.length, 3);
  assert.ok(results.every(({ forecast }) => forecast === null));
});
