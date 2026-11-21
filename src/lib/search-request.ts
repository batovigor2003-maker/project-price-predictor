import type { TicketInput } from './demo-data';

const requestTimeoutMs = 15_000;

export type SearchFailure = 'network_error' | 'service_error' | 'invalid_search' | 'ticket_not_found';

export class SearchRequestError extends Error {
  constructor(readonly kind: SearchFailure) {
    super(kind);
  }
}

export async function requestSearch<T>(path: string, input: TicketInput, signal: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal.aborted) cancel();
  signal.addEventListener('abort', cancel, { once: true });
  const timeout = window.setTimeout(cancel, requestTimeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      throw new SearchRequestError(controller.signal.aborted || error instanceof TypeError ? 'network_error' : 'service_error');
    }

    if (response.status >= 500) throw new SearchRequestError('service_error');

    const payload = await response.json();
    if (response.ok) return payload;
    if (response.status === 400 && payload?.code === 'invalid_search') throw new SearchRequestError('invalid_search');
    if (response.status === 404 && payload?.code === 'ticket_not_found') throw new SearchRequestError('ticket_not_found');
    throw new SearchRequestError('service_error');
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted) throw new SearchRequestError('network_error');
    if (error instanceof SearchRequestError) throw error;
    throw new SearchRequestError('service_error');
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}
