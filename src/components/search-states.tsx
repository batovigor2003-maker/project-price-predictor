import Image from 'next/image';
import type { ReactNode } from 'react';
import { Button } from './ui/button';

const content = {
  loading_flights: {
    title: 'Ищем билеты',
    description: 'Проверяем доступные варианты для вашего маршрута.',
    illustration: 'loading-flights',
  },
  loading_forecast: {
    title: 'Рассчитываем прогноз',
    description: 'Анализируем изменение цены на ближайшие 7 дней.',
    illustration: 'loading-forecast',
  },
  no_flights: {
    title: 'Билеты не найдены',
    description: 'Попробуйте выбрать другие даты или направление.',
    illustration: 'no-flights',
  },
  network_error: {
    title: 'Не удалось загрузить данные',
    description: 'Проверьте интернет и попробуйте ещё раз.',
    illustration: 'network-error',
  },
  service_error: {
    title: 'Сервис временно недоступен',
    description: 'Не можем обработать запрос. Попробуйте позже.',
    illustration: 'service-error',
  },
} as const;

type StateKind = keyof typeof content;
type StateAction = { label: string; onClick: () => void };

export function StateIllustration({ kind }: { kind: StateKind }) {
  return <Image
    className="state-illustration"
    src={`/state-illustrations/${content[kind].illustration}.webp`}
    width={108}
    height={108}
    alt=""
    unoptimized
    loading="eager"
  />;
}

export function StateActions({ primary, secondary }: { primary: StateAction; secondary?: StateAction }) {
  return <div className="state-actions">
    <Button type="button" onClick={primary.onClick} className="state-button text-base">{primary.label}</Button>
    {secondary && <Button type="button" onClick={secondary.onClick} className="state-button state-button-secondary text-base">{secondary.label}</Button>}
  </div>;
}

export function StateScreen({ kind, actions, children }: { kind: StateKind; actions?: ReactNode; children?: ReactNode }) {
  const { title, description } = content[kind];
  return <div key={kind} className="state-screen state-enter">
    <StateIllustration kind={kind}/>
    <div>
      <h1 id="search-title" tabIndex={-1} aria-describedby="state-description" className="search-heading">{title}</h1>
      <p id="state-description" className="state-description">{description}</p>
    </div>
    {kind === 'loading_flights' && <FlightSkeleton/>}
    {kind === 'loading_forecast' && <ForecastSkeleton/>}
    {children}
    {actions}
  </div>;
}

export function FlightSkeleton() {
  return <div className="flight-rows" aria-hidden="true">
    {[0, 1].map((row) => <div key={row} className="flight-row">
      <span className="state-shimmer size-9"/>
      <div className="min-w-0">
        <span className="state-shimmer h-3 w-3/4"/>
        <span className="state-shimmer mt-2 h-2 w-1/2"/>
      </div>
      <span className="state-shimmer h-4 w-12 sm:w-16"/>
    </div>)}
  </div>;
}

export function ForecastSkeleton() {
  return <div className="forecast-skeleton" aria-hidden="true">
    <div className="forecast-skeleton-prices">
      {[0, 1].map((column) => <div key={column}>
        <span className="state-shimmer h-2 w-12"/>
        <span className="state-shimmer mt-2 h-4 w-16"/>
      </div>)}
    </div>
    <div className="forecast-skeleton-chart">
      {[14, 21, 29, 23, 34, 31, 40].map((height, index) => (
        <span key={index} className="state-shimmer" style={{ height }}/>
      ))}
    </div>
  </div>;
}
