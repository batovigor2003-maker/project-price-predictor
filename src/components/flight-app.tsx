'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { FlightDateCalendar, type DateFieldName, type FlightDates } from './flight-date-calendar';
import { cities, cityName, cabinClasses, type TicketInput } from '@/lib/demo-data';
import type { Flight } from '@/lib/search-contract';
import { TicketResults } from './ticket-results';
import { StateActions, StateScreen } from './search-states';
import { useFlightSearch } from './use-flight-search';

const classNames: Record<string, string> = { economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', first: 'Первый класс' };
const dateLabel = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(value + 'T12:00:00'));
const fullDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
const compactDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value + 'T12:00:00'));
const fromTicket = (ticket: Flight): TicketInput => ({ originCode: ticket.originCode, destinationCode: ticket.destinationCode, departureDate: ticket.departureDate, returnDate: ticket.returnDate, adults: ticket.adults, children: ticket.children, infants: ticket.infants, cabinClass: ticket.cabinClass });

export function FlightApp({ tickets }: { tickets: Flight[] }) {
  const initialForm = {
    ...fromTicket(tickets.find((ticket) => ticket.returnDate === null) ?? tickets[0]),
    returnDate: null,
  };
  const [form, setForm] = useState<TicketInput>(initialForm);
  const { state, reset, submit } = useFlightSearch();
  const previousStatus = useRef(state.status);
  const [calendar, setCalendar] = useState<{ field: DateFieldName; trigger: HTMLButtonElement } | null>(null);
  const [passengerOpen, setPassengerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const featured = tickets.filter((_, index) => index % 10 === 0);
  const passengerCount = form.adults + form.children + form.infants;
  const passengerWord = passengerCount % 100 >= 11 && passengerCount % 100 <= 14 ? 'пассажиров' : passengerCount % 10 === 1 ? 'пассажир' : passengerCount % 10 >= 2 && passengerCount % 10 <= 4 ? 'пассажира' : 'пассажиров';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (passengerOpen) {
      dialog.classList.remove('is-closing');
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        dialog.close();
        return;
      }
      dialog.classList.add('is-closing');
      const timer = window.setTimeout(() => {
        dialog.close();
        dialog.classList.remove('is-closing');
      }, 140);
      return () => window.clearTimeout(timer);
    }
  }, [passengerOpen]);

  useEffect(() => {
    if (previousStatus.current === state.status) return;
    const previous = previousStatus.current;
    previousStatus.current = state.status;
    if (previous === 'idle' || state.status === 'idle') window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('search-title')?.focus({ preventScroll: true });
  }, [state.status]);

  const set = <K extends keyof TicketInput>(key: K, value: TicketInput[K]) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      if (key === 'adults') next.infants = Math.min(next.infants, Number(value));
      return next;
    });
    if (state.status === 'idle' && state.invalid) reset();
  };

  function confirmDates(dates: FlightDates) {
    setForm((previous) => ({ ...previous, ...dates }));
    if (state.status === 'idle' && state.invalid) reset();
  }

  function findAnotherFlight() {
    reset();
    setForm(initialForm);
  }

  function selectTicket(ticket: Flight) {
    const input = fromTicket(ticket);
    setForm(input);
    void submit(input);
  }

  const findAnotherAction = { label: 'Найти другой рейс', onClick: findAnotherFlight };

  function searchFeedback() {
    switch (state.status) {
      case 'loading_flights':
      case 'loading_forecast':
        return <StateScreen kind={state.status}/>;
      case 'no_flights':
        return <StateScreen kind={state.status} actions={<StateActions
          primary={{ label: 'Изменить поиск', onClick: reset }}
        />}/>;
      case 'network_error':
      case 'service_error':
        return <StateScreen kind={state.status} actions={<StateActions
          primary={{ label: 'Попробовать ещё раз', onClick: () => void submit(state.input, state.stage) }}
          secondary={findAnotherAction}
        />}/>;
      default:
        return null;
    }
  }

  const idle = state.status === 'idle';
  const feedback = !idle && state.status !== 'success';

  function moveCarousel(direction: -1 | 1) {
    const track = carouselRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return <div className={feedback ? 'app-shell app-shell-feedback' : 'app-shell'}>
    <header className="app-header">
      <div className="app-header-content mx-auto flex max-w-6xl items-center justify-between gap-3">
        <a href="/" onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          findAnotherFlight();
          window.scrollTo({ top: 0, behavior: 'instant' });
        }} className="flex items-center gap-2.5 text-base font-semibold tracking-tight"><span className="brand-mark" aria-hidden="true"><span className="size-2 rounded-full bg-white"/></span>Чекбилет</a>
        <span className="text-[11px] font-medium text-white/80 sm:text-xs">Демо на тестовых данных</span>
      </div>
    </header>

    <main className={`app-main mx-auto max-w-[960px] ${feedback ? 'app-main-feedback' : 'pb-6 sm:pb-8'}`}>
      {idle && <section className="pt-4 sm:pt-6" aria-labelledby="carousel-title">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 id="carousel-title" className="text-lg font-bold leading-tight tracking-tight sm:text-2xl">Что ищут другие 👀</h2>
          <div className="hidden gap-2 sm:flex">
            <button type="button" aria-label="Предыдущие маршруты" onClick={() => moveCarousel(-1)} className="carousel-arrow"><ChevronLeft size={20}/></button>
            <button type="button" aria-label="Следующие маршруты" onClick={() => moveCarousel(1)} className="carousel-arrow"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div ref={carouselRef} className="carousel-track -mx-1 flex snap-x snap-mandatory scroll-px-1 gap-2 overflow-x-auto p-1 sm:gap-3">
          {featured.map((ticket) => <button key={ticket.id} type="button" onClick={() => selectTicket(ticket)} className="carousel-card inline-flex min-h-11 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap px-3.5 sm:min-h-12 sm:px-5">
            <span aria-hidden="true" className="text-base leading-none sm:text-xl">✈️</span>
            <span className="text-[13px] font-bold sm:text-sm">{cityName(ticket.originCode)} — {cityName(ticket.destinationCode)}</span>
          </button>)}
        </div>
      </section>}

      <section id="search" className={feedback ? undefined : 'scroll-mt-4 pt-3 sm:pt-5'} aria-labelledby="search-title">
        {state.status === 'success' && <div className="summary-card search-result-width state-enter grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:px-6">
          <div className="break-words">
            <p className="text-xs font-medium text-[var(--muted)]">Результаты поиска</p>
            <h1 id="search-title" tabIndex={-1} className="mt-1 text-lg font-semibold sm:text-xl">{cityName(form.originCode)} <ArrowRight className="inline size-4 text-[var(--brand)]"/> {cityName(form.destinationCode)}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{dateLabel(form.departureDate)}{form.returnDate && ` — ${dateLabel(form.returnDate)}`} · {passengerCount} {passengerWord} · {classNames[form.cabinClass].toLowerCase()}</p>
          </div>
          <button type="button" onClick={reset} className="action-control secondary-action whitespace-nowrap px-3">Изменить</button>
        </div>}
        {idle && <div className="search-card">
          <div className="mb-3 max-w-2xl sm:mb-5">
            <h1 id="search-title" tabIndex={-1} className="search-heading">Покупать сейчас или подождать?</h1>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void submit(form); }}>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="route-fields sm:col-span-2">
                <Field label="Откуда"><select value={form.originCode} onChange={(e) => set('originCode', e.target.value)}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></Field>
                <Field label="Куда"><select value={form.destinationCode} onChange={(e) => set('destinationCode', e.target.value)}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></Field>
              </div>
              <div className="date-fields grid grid-cols-2 gap-3 sm:contents">
                <DateField label="Дата вылета" value={form.departureDate} onClick={(event) => setCalendar({ field: 'departure', trigger: event.currentTarget })}/>
                <DateField label="Обратно" value={form.returnDate ?? ''} placeholder="Необязательно" onClick={(event) => setCalendar({ field: 'return', trigger: event.currentTarget })}/>
              </div>
            </div>
            <button type="button" className="passenger-trigger mt-3 flex min-h-14 w-full items-center justify-between px-4 py-2.5 text-left sm:mt-4" onClick={() => setPassengerOpen(true)}>
              <span><span className="block text-xs font-medium text-[var(--muted)]">Пассажиры и класс</span><span className="mt-0.5 block text-base font-medium">{passengerCount} {passengerWord}, {classNames[form.cabinClass].toLowerCase()}</span></span><ChevronDown size={18} className="shrink-0 text-[var(--muted)]"/>
            </button>
            <div className="mt-3 sm:mt-5">
              {state.invalid && <p role="alert" className="mb-3 text-sm text-[#a03232]">Проверьте маршрут, даты и пассажиров.</p>}
              <Button variant="highlight" size="lg" className="w-full text-base">Узнать прогноз</Button>
            </div>
          </form>
        </div>}
        {searchFeedback()}
      </section>

      {state.status === 'success' && <TicketResults tickets={state.flights} forecasts={state.forecasts}/>}
    </main>

    {calendar && <FlightDateCalendar value={form} {...calendar} onConfirm={confirmDates} onClose={() => setCalendar(null)}/>}

    <dialog ref={dialogRef} onClose={() => setPassengerOpen(false)} onCancel={(event) => { event.preventDefault(); setPassengerOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setPassengerOpen(false); }} className="passenger-dialog w-[calc(100%-24px)] max-w-md p-0">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><h2 className="text-xl font-semibold">Пассажиры и класс</h2><button type="button" aria-label="Закрыть" onClick={() => setPassengerOpen(false)} className="action-control grid size-11 place-items-center rounded-xl hover:bg-[var(--field)]"><X size={19}/></button></div>
      <div className="px-5 py-2">
        <Counter label="Взрослые" detail="От 12 лет" value={form.adults} min={1} max={9} onChange={(value) => set('adults', value)}/>
        <Counter label="Дети" detail="От 2 до 11 лет" value={form.children} min={0} max={9} onChange={(value) => set('children', value)}/>
        <Counter label="Младенцы" detail="До 2 лет, без места" value={form.infants} min={0} max={form.adults} onChange={(value) => set('infants', value)}/>
        <div className="border-t border-[var(--line)] py-4"><p className="mb-3 text-sm font-semibold">Класс обслуживания</p><div className="grid grid-cols-2 gap-2">{cabinClasses.map((value) => <button key={value} type="button" aria-pressed={form.cabinClass === value} onClick={() => set('cabinClass', value)} className="cabin-option flex items-center justify-between px-3 py-3 text-left text-sm font-medium">{classNames[value]}{form.cabinClass === value && <Check size={16}/>}</button>)}</div></div>
      </div>
      <div className="border-t border-[var(--line)] p-4"><Button type="button" onClick={() => setPassengerOpen(false)} className="h-12 w-full text-base">Готово</Button></div>
    </dialog>
    <footer className="border-t border-[var(--line)] bg-white px-5 py-7 text-center text-xs leading-5 text-[var(--muted)]">Демо на тестовых данных</footer>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return <label className="block min-w-0"><span className="mb-2 block text-sm font-medium">{label}</span><div className="field-control">{children}</div></label>;
}

function DateField({ label, value, onClick, placeholder = 'Выберите дату' }: {
  label: string;
  value: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  placeholder?: string;
}) {
  return <button type="button" aria-haspopup="dialog" onClick={onClick} className="block min-w-0 text-left">
    <span className="mb-2 block text-xs font-medium text-[var(--muted)]">{label}</span>
    <span className="date-control flex h-14 min-w-0 items-center justify-between gap-1 px-2.5 max-[374px]:px-1.5 sm:px-4">
      <span className={`min-w-0 truncate text-base font-medium ${value ? '' : 'text-[var(--muted)]'}`}>
        <span className="sm:hidden">{value ? compactDate(value) : placeholder}</span>
        <span className="hidden sm:inline">{value ? fullDate(value) : placeholder}</span>
      </span>
      <CalendarDays size={16} className={`shrink-0 text-[var(--muted)] ${value ? '' : 'hidden sm:block'}`} aria-hidden="true"/>
    </span>
  </button>;
}

function Counter({ label, detail, value, min, max, onChange }: { label: string; detail: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between border-b border-[var(--line)] py-4"><div><p className="font-medium">{label}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{detail}</p></div><div className="flex items-center gap-2"><button type="button" aria-label={`Уменьшить: ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="counter-button"><Minus size={17}/></button><span className="w-5 text-center font-semibold">{value}</span><button type="button" aria-label={`Увеличить: ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="counter-button"><Plus size={17}/></button></div></div>;
}
