import { ArrowDownRight, ArrowRight, ArrowRightLeft, ArrowUpRight, Clock } from 'lucide-react';
import type { FlightLeg, FlightSource, ResultTicket, TicketForecast } from '@/lib/search-contract';

const airlineMarks: Record<string, string> = { SU: 'aeroflot', S7: 's7', U6: 'ural' };

const forecastLabels = {
  down: { label: 'Цена снизится', Icon: ArrowDownRight },
  up: { label: 'Цена вырастет', Icon: ArrowUpRight },
  stable: { label: 'Цена почти без изменений', Icon: ArrowRight },
};

export function TicketResults({ tickets, forecasts, source }: {
  tickets: ResultTicket[];
  source: FlightSource;
  forecasts: Record<string, TicketForecast>;
}) {
  return <section id="forecast" aria-label="Найденные билеты" className="search-result-width mt-2">
    {source === 'demo' && <p className="mb-2 px-1 text-center text-xs leading-5 text-[var(--muted)] max-[350px]:text-[11px]">
      Прогноз показывает вероятность изменения цены<br/>
      от сегодня до дня вылета
    </p>}
    <ul className="grid gap-2.5">
      {tickets.map((ticket) => <li key={ticket.id}><TicketCard ticket={ticket} forecast={forecasts[ticket.id]} live={source === 'ignav'}/></li>)}
    </ul>
  </section>;
}

function TicketCard({ ticket, forecast, live }: { ticket: ResultTicket; forecast?: TicketForecast; live: boolean }) {
  const { amount, currency, approximate } = ticket.price;
  const price = new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency, minimumFractionDigits: 0,
  }).format(amount);

  return <article aria-label={ticket.outbound.airline.name ?? 'Вариант перелёта'} className="result-card state-enter">
    <div className="ticket-heading">
      <p className="whitespace-nowrap text-lg font-semibold sm:text-xl">{price}</p>
      {live
        ? approximate && <p className="ticket-forecast ticket-forecast-unavailable">Ориентировочная цена</p>
        : forecast ? <ForecastSummary forecast={forecast}/> : <p className="ticket-forecast ticket-forecast-unavailable">Прогноз пока недоступен</p>}
    </div>
    <div className="ticket-legs">
      <Itinerary leg={ticket.outbound} showAirline={live} label={ticket.inbound ? 'Туда' : undefined}/>
      {ticket.inbound && <div className="mt-2.5 border-t border-[var(--line)] pt-2.5">
        <Itinerary leg={ticket.inbound} showAirline={live} label="Обратно"/>
      </div>}
    </div>
  </article>;
}

function ForecastSummary({ forecast }: { forecast: TicketForecast }) {
  const { label, Icon } = forecastLabels[forecast.direction];
  return <div className="ticket-forecast">
    <span className={`status-badge status-${forecast.direction}`}><Icon aria-hidden="true"/>{label}</span>
    <span className="ticket-probability">Вероятность {forecast.probability}%</span>
  </div>;
}

function Itinerary({ leg, showAirline, label }: { leg: FlightLeg; showAirline: boolean; label?: string }) {
  const { code, name } = leg.airline;
  const airline = code ? airlineMarks[code] : undefined;
  const airlineName = name ?? code ?? 'Авиакомпания не указана';
  const hours = Math.floor((leg.durationMinutes ?? 0) / 60);
  const minutes = (leg.durationMinutes ?? 0) % 60;
  const duration = [hours && `${hours} ч`, minutes && `${minutes} м`].filter(Boolean).join(' ');
  const stopsLabel = leg.stops === 0 ? 'Без пересадок'
    : leg.stops % 100 >= 11 && leg.stops % 100 <= 14 ? `${leg.stops} пересадок`
    : leg.stops % 10 === 1 ? `${leg.stops} пересадка`
    : leg.stops % 10 >= 2 && leg.stops % 10 <= 4 ? `${leg.stops} пересадки`
    : `${leg.stops} пересадок`;
  const dayOffset = leg.arrivalDayOffset > 0 ? `+${leg.arrivalDayOffset}` : leg.arrivalDayOffset;

  return <div>
    {(label || showAirline) && <p className="mb-1.5 text-xs font-medium text-[var(--muted)]">
      {[label, showAirline && airlineName, showAirline && leg.flightNumber].filter(Boolean).join(' · ')}
    </p>}
    <div className="ticket-itinerary text-xs text-[var(--muted)]">
      <span className={`airline-mark${airline ? ` airline-${airline}` : ' bg-[var(--field)]'}`} role="img" aria-label={airlineName} title={airlineName}>
        {airline === 'aeroflot'
          ? <span className="airline-wing" aria-hidden="true"><span/><span/><span/></span>
          : <span aria-hidden="true">{code ?? '✈'}</span>}
      </span>
      <div className="ticket-airports">
        <div className="ticket-airport-pair">
          <p className="ticket-time">{leg.departureTime}</p>
          <p className="ticket-airport">{leg.departureAirport}</p>
        </div>
        <span className="ticket-time-divider" aria-hidden="true"/>
        <div className="ticket-airport-pair">
          <p className="ticket-time">{leg.arrivalTime}{dayOffset !== 0 && <sup className="ml-0.5 text-[10px] font-normal text-[var(--muted)]">{dayOffset}</sup>}</p>
          <p className="ticket-airport">{leg.arrivalAirport}</p>
        </div>
      </div>
      <div className="ticket-flight-details">
        {duration && <p className="ticket-duration">
          <Clock aria-hidden="true"/>
          <span>{duration} в пути</span>
        </p>}
        <p className="ticket-stops">
          <span className="ticket-stops-icon" aria-hidden="true"><ArrowRightLeft/></span>
          <span>{stopsLabel}</span>
        </p>
      </div>
    </div>
  </div>;
}
