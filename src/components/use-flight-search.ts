'use client';

import { useEffect, useRef, useState } from 'react';
import type { TicketInput } from '@/lib/demo-data';
import type { Flight, FlightResponse, ForecastResponse, ForecastResult } from '@/lib/search-contract';
import { requestSearch, SearchRequestError } from '@/lib/search-request';

type SearchStage = { step: 'flights' } | { step: 'forecast'; flights: Flight[] };

type SearchState =
  | { status: 'idle'; invalid?: boolean }
  | { status: 'loading_flights' | 'no_flights' }
  | { status: 'loading_forecast'; flights: Flight[] }
  | { status: 'success'; forecast: ForecastResult }
  | { status: 'partial_success'; flights: Flight[]; forecast: 'no_prediction' }
  | { status: 'network_error' | 'service_error'; stage: SearchStage; input: TicketInput };

export function useFlightSearch() {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
  }, []);

  function reset() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setState({ status: 'idle' });
  }

  async function submit(input: TicketInput, initialStage: SearchStage = { step: 'flights' }) {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const isCurrent = () => activeRequest.current === controller && !controller.signal.aborted;
    let stage = initialStage;

    try {
      if (stage.step === 'flights') {
        setState({ status: 'loading_flights' });
        const result = await requestSearch<FlightResponse>('/api/tickets', input, controller.signal);
        if (!isCurrent()) return;
        if (!Array.isArray(result?.tickets)) throw new SearchRequestError('service_error');
        if (result.tickets.length === 0) {
          setState({ status: 'no_flights' });
          return;
        }
        stage = { step: 'forecast', flights: result.tickets };
      }

      const { flights } = stage;
      setState({ status: 'loading_forecast', flights });
      const forecast = await requestSearch<ForecastResponse>('/api/forecast', input, controller.signal);
      if (!isCurrent()) return;

      if (forecast?.status === 'no_prediction') {
        setState({ status: 'partial_success', flights, forecast: 'no_prediction' });
      } else if (forecast?.status === 'success' && forecast.ticket) {
        setState({ status: 'success', forecast: forecast.ticket });
      } else {
        throw new SearchRequestError('service_error');
      }
    } catch (error) {
      if (!isCurrent()) return;
      const kind = error instanceof SearchRequestError ? error.kind : 'service_error';
      switch (kind) {
        case 'invalid_search':
          setState({ status: 'idle', invalid: true });
          break;
        case 'ticket_not_found':
          setState({ status: 'no_flights' });
          break;
        default:
          setState({ status: kind, stage, input });
      }
    } finally {
      if (isCurrent()) activeRequest.current = null;
    }
  }

  return { state, reset, submit };
}
