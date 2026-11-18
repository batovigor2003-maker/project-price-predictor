'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Info, Minus, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { cities, cityName, cabinClasses, type TicketInput } from '@/lib/demo-data';
import type { Ticket } from '@/db/schema';

type DisplayTicket = Omit<Ticket, 'createdAt'>;
const classNames: Record<string, string> = { economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', first: 'Первый класс' };
const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const dateLabel = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(value + 'T12:00:00'));
const fullDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
const compactDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value + 'T12:00:00'));
const fromTicket = (ticket: DisplayTicket): TicketInput => ({ originCode: ticket.originCode, destinationCode: ticket.destinationCode, departureDate: ticket.departureDate, returnDate: ticket.returnDate, adults: ticket.adults, children: ticket.children, infants: ticket.infants, cabinClass: ticket.cabinClass });

export function FlightApp({ tickets }: { tickets: DisplayTicket[] }) {
  const [form, setForm] = useState<TicketInput>(() => ({
    ...fromTicket(tickets.find((ticket) => ticket.returnDate === null) ?? tickets[0]),
    returnDate: null,
  }));
  const [result, setResult] = useState<DisplayTicket | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [passengerOpen, setPassengerOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
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

  const set = <K extends keyof TicketInput>(key: K, value: TicketInput[K]) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      if (key === 'adults') next.infants = Math.min(next.infants, Number(value));
      return next;
    });
    setResult(null);
    setError('');
  };

  async function submit(input = form) {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const response = await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Не удалось получить прогноз.');
      setResult(payload.ticket);
      setFormCollapsed(true);
      requestAnimationFrame(() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось получить прогноз.');
    } finally {
      setLoading(false);
    }
  }

  function selectTicket(ticket: DisplayTicket) {
    const input = fromTicket(ticket);
    setForm(input);
    void submit(input);
  }

  function moveCarousel(direction: -1 | 1) {
    const next = (carouselIndex + direction + featured.length) % featured.length;
    setCarouselIndex(next);
    carouselRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  return <div className="app-shell">
    <header className="app-header px-4 sm:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-tight"><span className="brand-mark" aria-hidden="true"><span className="size-2 rounded-full bg-white"/></span>Чекбилет</a>
        <span className="text-[11px] font-medium text-white/80 sm:text-xs">Демо на тестовых данных</span>
      </div>
    </header>

    <main className="mx-auto max-w-[960px] px-4 pb-6 sm:px-6 sm:pb-8">
      <section id="search" className={`scroll-mt-4 ${formCollapsed && result ? 'pt-5' : 'pt-5 sm:pt-10'}`} aria-labelledby="search-title">
        {formCollapsed && result ? <div className="summary-card result-enter flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <div className="min-w-0"><p className="text-xs font-medium text-[var(--muted)]">Ваш билет</p><h1 id="search-title" className="mt-1 text-lg font-semibold sm:text-xl">{cityName(form.originCode)} <ArrowRight className="inline size-4 text-[var(--brand)]"/> {cityName(form.destinationCode)}</h1><p className="mt-1 text-sm text-[var(--muted)]">{dateLabel(form.departureDate)}{form.returnDate && ` — ${dateLabel(form.returnDate)}`} · {passengerCount} {passengerWord} · {classNames[form.cabinClass].toLowerCase()}</p></div>
          <button type="button" onClick={() => setFormCollapsed(false)} className="action-control secondary-action px-3">Изменить</button>
        </div> : <div className="search-card">
          <div className="mb-4 max-w-2xl sm:mb-5">
            <h1 id="search-title" className="text-[28px] font-semibold leading-[1.14] tracking-[-.035em] sm:text-[38px]">Покупать сейчас или подождать?</h1>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="route-fields sm:col-span-2">
                <Field label="Откуда"><select value={form.originCode} onChange={(e) => set('originCode', e.target.value)}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></Field>
                <Field label="Куда"><select value={form.destinationCode} onChange={(e) => set('destinationCode', e.target.value)}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></Field>
              </div>
              <div className="date-fields grid grid-cols-2 gap-3 sm:contents">
                <DateField label="Дата вылета" value={form.departureDate} required onChange={(value) => set('departureDate', value)}/>
                <DateField label="Обратно" value={form.returnDate ?? ''} min={form.departureDate} placeholder="Необязательно" clearable onChange={(value) => set('returnDate', value || null)}/>
              </div>
            </div>
            <button type="button" className="passenger-trigger mt-4 flex min-h-14 w-full items-center justify-between px-4 py-2.5 text-left" onClick={() => setPassengerOpen(true)}>
              <span><span className="block text-xs font-medium text-[var(--muted)]">Пассажиры и класс</span><span className="mt-0.5 block text-sm font-medium sm:text-base">{passengerCount} {passengerWord}, {classNames[form.cabinClass].toLowerCase()}</span></span><ChevronDown size={18} className="shrink-0 text-[var(--muted)]"/>
            </button>
            <div className="mt-5">
              <Button variant="highlight" size="lg" disabled={loading} aria-busy={loading} className="w-full text-base">{loading ? 'Ищем прогноз…' : 'Узнать прогноз'}</Button>
            </div>
          </form>
        </div>}
      </section>

      <section id="forecast" aria-live="polite" className="pt-4 sm:pt-6">
        {error && <div className="rounded-2xl border border-[#ffd9d9] bg-[#fff5f5] p-5 text-[#a03232]">{error}</div>}
        {result && <Forecast key={result.id} ticket={result}/>}
      </section>

      <section className="pt-10 sm:pt-12" aria-labelledby="carousel-title">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 id="carousel-title" className="text-xl font-semibold sm:text-2xl">Что ищут другие 👀</h2>
          <div className="hidden gap-2 sm:flex"><button type="button" aria-label="Предыдущий билет" onClick={() => moveCarousel(-1)} className="carousel-arrow"><ChevronLeft size={20}/></button><button type="button" aria-label="Следующий билет" onClick={() => moveCarousel(1)} className="carousel-arrow"><ChevronRight size={20}/></button></div>
        </div>
        <div className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
          <div ref={carouselRef} className="carousel-track flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4" onScroll={(event) => {
            const track = event.currentTarget;
            const first = track.firstElementChild as HTMLElement | null;
            if (first) setCarouselIndex(Math.min(featured.length - 1, Math.round(track.scrollLeft / (first.offsetWidth + 12))));
          }}>
            {featured.map((ticket, index) => <button key={ticket.id} type="button" onClick={() => selectTicket(ticket)} className="carousel-card min-w-[245px] snap-start p-5 text-left sm:min-w-[290px]">
              <span className="flex items-center justify-between"><span className="text-xs font-medium text-[var(--muted)]">Маршрут {index + 1}</span><ArrowUpRight size={17} className="text-[var(--muted)]"/></span>
              <span className="mt-5 block text-lg font-semibold">{cityName(ticket.originCode)} <ArrowRight size={15} className="inline text-[var(--muted)]"/> {cityName(ticket.destinationCode)}</span>
              <span className="mt-2 block text-sm text-[var(--muted)]">{dateLabel(ticket.departureDate)} · {classNames[ticket.cabinClass]}</span>
              <span className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4"><span className="text-lg font-semibold">{money(ticket.currentPriceRub)}</span><span className="text-sm font-semibold text-[var(--brand)]">Проверить</span></span>
            </button>)}
          </div>
        </div>
      </section>
    </main>

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
    <footer className="border-t border-[var(--line)] bg-white px-5 py-7 text-center text-xs leading-5 text-[var(--muted)]">Чекбилет · Демонстрация на синтетических данных. Цены и прогнозы вымышлены, качество на реальных ценах пока не проверено.</footer>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  return <label className="block min-w-0"><span className="mb-2 block text-sm font-medium">{label}</span><div className="field-control">{children}</div></label>;
}

function DateField({ label, value, onChange, min, required, placeholder = 'Выберите дату', clearable = false }: { label: string; value: string; onChange: (value: string) => void; min?: string; required?: boolean; placeholder?: string; clearable?: boolean }) {
  const id = useId();
  return <div className="block min-w-0"><label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label><div className="date-control relative flex h-14 min-w-0 items-center justify-between gap-1 px-2.5 sm:px-4"><span className={`min-w-0 truncate text-[13px] font-medium sm:text-base ${value ? '' : 'text-[var(--muted)]'}`}><span className="sm:hidden">{value ? compactDate(value) : placeholder === 'Выберите дату' ? 'Выбрать' : placeholder}</span><span className="hidden sm:inline">{value ? fullDate(value) : placeholder}</span></span>{clearable && value ? <button type="button" aria-label="Убрать обратную дату" onClick={() => onChange('')} className="date-clear action-control relative z-10 grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-white"><X size={16} aria-hidden="true"/></button> : <CalendarDays size={16} className="shrink-0 text-[var(--muted)]" aria-hidden="true"/>}<input id={id} type="date" value={value} min={min} required={required} aria-label={label} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0"/></div></div>;
}

function Counter({ label, detail, value, min, max, onChange }: { label: string; detail: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between border-b border-[var(--line)] py-4"><div><p className="font-medium">{label}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{detail}</p></div><div className="flex items-center gap-2"><button type="button" aria-label={`Уменьшить: ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="counter-button"><Minus size={17}/></button><span className="w-5 text-center font-semibold">{value}</span><button type="button" aria-label={`Увеличить: ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="counter-button"><Plus size={17}/></button></div></div>;
}

function DirectionBadge({ ticket }: { ticket: DisplayTicket }) {
  const up = ticket.direction === 'up'; const down = ticket.direction === 'down';
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : ArrowRight;
  return <span className={`status-badge ${up ? 'status-up' : down ? 'status-down' : 'status-flat'}`}><Icon size={14}/>{up ? 'Вырастет' : down ? 'Снизится' : 'Почти без изменений'}</span>;
}

function Forecast({ ticket }: { ticket: DisplayTicket }) {
  const up = ticket.direction === 'up'; const down = ticket.direction === 'down';
  const advice = up ? 'Покупайте сейчас' : down ? 'Лучше подождать' : 'Можно подождать';
  const reason = up ? `Тестовый сценарий: цена вырастет на ${ticket.changePercent}% за 7 дней.` : down ? `Тестовый сценарий: цена снизится на ${Math.abs(ticket.changePercent)}% за 7 дней.` : `Тестовый сценарий: изменение на ${Math.abs(ticket.changePercent)}% укладывается в порог ±5%.`;
  const difference = Math.abs(ticket.predictedPriceRub - ticket.currentPriceRub);
  return <div className="result-card">
    <div className="result-enter px-5 pb-6 pt-6 sm:px-8 sm:pt-8" data-step="advice">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-[var(--muted)]">Рекомендация</p><DirectionBadge ticket={ticket}/></div>
      <h2 className="mt-3 text-[29px] font-semibold leading-[1.15] tracking-[-.03em] sm:text-4xl">{advice}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)] sm:text-base">{reason}</p>
    </div>
    <div className="result-enter px-5 sm:px-8" data-step="prices">
      <div className="result-prices grid grid-cols-2 py-5">
        <div className="min-w-0 pr-3"><p className="text-xs text-[var(--muted)] sm:text-sm">Цена сейчас</p><p className="mt-1.5 whitespace-nowrap text-[21px] font-semibold tracking-tight sm:text-3xl">{money(ticket.currentPriceRub)}</p></div>
        <div className="min-w-0 pl-3 sm:pl-6"><p className="text-xs text-[var(--muted)] sm:text-sm">Через 7 дней*</p><p className="mt-1.5 whitespace-nowrap text-[21px] font-semibold tracking-tight sm:text-3xl">{money(ticket.predictedPriceRub)}</p></div>
      </div>
    </div>
    <div className="result-enter px-5 pb-6 pt-5 sm:px-8 sm:pb-8" data-step="detail">
      {difference > 0 && <p className="text-sm font-semibold text-[var(--brand)]">{up ? 'Если купить сейчас, разница' : 'Если подождать, разница'} · {money(difference)}</p>}
      <p className="mt-3 text-sm font-medium">{cityName(ticket.originCode)} → {cityName(ticket.destinationCode)}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Вылет {dateLabel(ticket.departureDate)}{ticket.returnDate && ` · обратно ${dateLabel(ticket.returnDate)}`} · {ticket.adults} взр.{ticket.children > 0 && ` · ${ticket.children} реб.`}{ticket.infants > 0 && ` · ${ticket.infants} мл.`} · {classNames[ticket.cabinClass]}</p>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]"><Info size={14} className="mt-0.5 shrink-0"/>*Тестовый сценарий на синтетических данных. Реальная цена может измениться иначе.</p>
    </div>
  </div>;
}
