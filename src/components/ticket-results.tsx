import { ArrowDownRight, ArrowRight, ArrowRightLeft, ArrowUpRight, Clock } from 'lucide-react';
import type { FlightLeg, ResultTicket, TicketForecast } from '@/lib/search-contract';

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
});

const airlineNames = {
  aeroflot: 'Аэрофлот',
  s7: 'S7 Airlines',
  ural: 'Уральские авиалинии',
};

const forecastLabels = {
  down: { label: 'Цена снизится', Icon: ArrowDownRight },
  up: { label: 'Цена вырастет', Icon: ArrowUpRight },
  stable: { label: 'Цена почти без изменений', Icon: ArrowRight },
};

export function TicketResults({ tickets, forecasts }: {
  tickets: ResultTicket[];
  forecasts: Record<string, TicketForecast>;
}) {
  return <section id="forecast" aria-label="Найденные билеты" className="search-result-width mt-2">
    <p className="mb-2 px-1 text-center text-xs leading-5 text-[var(--muted)]">Прогноз показывает вероятность изменения цены до дня вылета</p>
    <ul className="grid gap-2.5">
      {tickets.map((ticket) => <li key={ticket.id}><TicketCard ticket={ticket} forecast={forecasts[ticket.id]}/></li>)}
    </ul>
  </section>;
}

function TicketCard({ ticket, forecast }: { ticket: ResultTicket; forecast?: TicketForecast }) {
  const airlineName = airlineNames[ticket.airline];

  return <article aria-label={airlineName} className="result-card state-enter">
    <div className="ticket-heading">
      <p className="whitespace-nowrap text-lg font-semibold sm:text-xl">{currency.format(ticket.currentPriceRub)}</p>
      {forecast ? <ForecastSummary forecast={forecast}/> : <p className="ticket-forecast ticket-forecast-unavailable">Прогноз пока недоступен</p>}
    </div>
    <div className="ticket-legs">
      <Itinerary leg={ticket.outbound} airline={ticket.airline} label={ticket.inbound ? 'Туда' : undefined}/>
      {ticket.inbound && <div className="mt-2.5 border-t border-[var(--line)] pt-2.5">
        <Itinerary leg={ticket.inbound} airline={ticket.airline} label="Обратно"/>
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

function Itinerary({ leg, airline, label }: { leg: FlightLeg; airline: ResultTicket['airline']; label?: string }) {
  const hours = Math.floor(leg.durationMinutes / 60);
  const minutes = leg.durationMinutes % 60;
  const duration = [hours && `${hours} ч`, minutes && `${minutes} м`].filter(Boolean).join(' ');
  const dayOffset = leg.arrivalDayOffset > 0 ? `+${leg.arrivalDayOffset}` : leg.arrivalDayOffset;

  return <div>
    {label && <p className="mb-1.5 text-xs font-medium text-[var(--muted)]">{label}</p>}
    <div className="ticket-itinerary text-xs text-[var(--muted)]">
      <span className={`airline-mark airline-${airline}`} role="img" aria-label={airlineNames[airline]} title={airlineNames[airline]}>
        {airline === 'aeroflot'
          ? <span className="airline-wing" aria-hidden="true"><span/><span/><span/></span>
          : <span aria-hidden="true">{airline === 's7' ? 'S7' : 'U6'}</span>}
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
        <p className="ticket-duration">
          <Clock aria-hidden="true"/>
          <span>{duration} в пути</span>
        </p>
        <p className="ticket-stops">
          <span className="ticket-stops-icon" aria-hidden="true"><ArrowRightLeft/></span>
          <span>Без пересадок</span>
        </p>
      </div>
    </div>
  </div>;
}
