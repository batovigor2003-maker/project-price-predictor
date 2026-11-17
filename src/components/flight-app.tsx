'use client';

import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, ChevronRight, Info, Search, Ticket as TicketIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cities, cityName, cabinClasses, type TicketInput } from '@/lib/demo-data';
import type { Ticket } from '@/db/schema';

type DisplayTicket = Omit<Ticket, 'createdAt'>;
const classNames: Record<string, string> = { economy: 'Эконом', comfort: 'Комфорт', business: 'Бизнес', first: 'Первый класс' };
const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const dateLabel = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(value + 'T12:00:00'));
const fromTicket = (ticket: DisplayTicket): TicketInput => ({ originCode: ticket.originCode, destinationCode: ticket.destinationCode, departureDate: ticket.departureDate, returnDate: ticket.returnDate, adults: ticket.adults, children: ticket.children, infants: ticket.infants, cabinClass: ticket.cabinClass });

export function FlightApp({ tickets, source }: { tickets: DisplayTicket[]; source: 'database' | 'demo' }) {
  const [form, setForm] = useState<TicketInput>(fromTicket(tickets[0]));
  const [result, setResult] = useState<DisplayTicket | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [visible, setVisible] = useState(12);
  const filtered = useMemo(() => tickets.filter((ticket) => {
    const haystack = `${cityName(ticket.originCode)} ${cityName(ticket.destinationCode)} ${ticket.originCode} ${ticket.destinationCode}`.toLowerCase();
    return (directionFilter === 'all' || ticket.direction === directionFilter) && haystack.includes(query.toLowerCase().trim());
  }), [tickets, query, directionFilter]);
  const set = <K extends keyof TicketInput>(key: K, value: TicketInput[K]) => { setForm((previous) => ({ ...previous, [key]: value })); setResult(null); setError(''); };

  async function submit(input = form) {
    setLoading(true); setResult(null); setError('');
    try {
      const response = await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Не удалось получить прогноз.');
      setResult(payload.ticket);
      requestAnimationFrame(() => document.getElementById('forecast')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось получить прогноз.'); }
    finally { setLoading(false); }
  }

  function selectTicket(ticket: DisplayTicket) {
    const input = fromTicket(ticket);
    setForm(input);
    void submit(input);
  }

  return <div className="min-h-screen bg-[#f4faff] text-[#03195b]">
    <main>
      <section className="hero-gradient overflow-hidden px-5 pb-16 pt-6 text-white lg:px-8 lg:pb-20"><div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between"><a href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-[#03195b]"><span className="grid size-9 place-items-center rounded-full bg-[#03195b]" aria-hidden="true"><span className="size-2.5 rounded-full bg-[#cbe9fd]"/></span>Чекбилет</a><a href="#search" className="hidden items-center gap-2 rounded-full bg-[#03195b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2cb1] sm:flex">Проверить билет <ArrowRight size={17}/></a></header>
        <div className="relative mx-auto mt-8 grid h-52 max-w-xl place-items-center sm:h-64 lg:h-72"><div className="absolute size-[260px] rounded-full border border-[#1951fc]/20 sm:size-[360px] lg:size-[460px]"/><div className="absolute size-[190px] rounded-full border border-[#1951fc]/25 sm:size-[270px] lg:size-[340px]"/><div className="relative z-10 w-[min(100%,350px)] rounded-[24px] bg-white text-left text-[#03195b] shadow-[0_26px_60px_rgba(3,25,91,.22)] sm:w-[420px]"><div className="flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6"><div><strong className="block text-3xl sm:text-4xl">{tickets[0].originCode}</strong><span className="text-sm text-[#5d6c96]">{cityName(tickets[0].originCode)}</span></div><span className="mx-4 flex-1 border-t-2 border-dashed border-[#9fcafd]"/><div className="text-right"><strong className="block text-3xl sm:text-4xl">{tickets[0].destinationCode}</strong><span className="text-sm text-[#5d6c96]">{cityName(tickets[0].destinationCode)}</span></div></div><div className="ticket-divider mx-5 border-t-2 border-dashed border-[#dbe6f7]"/><div className="flex items-end justify-between gap-3 px-6 py-5 sm:px-8 sm:py-6"><div><span className="text-xs text-[#5d6c96]">Вылет {dateLabel(tickets[0].departureDate)}</span><strong className="mt-1 block text-xl sm:text-2xl">{money(tickets[0].currentPriceRub)}</strong></div><DirectionBadge ticket={tickets[0]}/></div></div></div>
        <div className="mx-auto mt-8 flex max-w-4xl flex-col items-center text-center"><h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-.025em] [text-shadow:0_2px_18px_rgba(3,25,91,.3)] sm:text-5xl lg:text-6xl">Подешевеет ли авиабилет? <span className="text-[#ffd166]">Проверьте</span> перед покупкой!</h1><p className="mt-5 max-w-2xl text-base leading-7 sm:text-lg">Укажите маршрут, даты поездки и пассажиров. Чекбилет покажет тестовый сценарий изменения цены и подскажет, покупать билет сейчас или подождать.</p><a href="#search" className="mt-7 inline-flex h-14 w-full max-w-[340px] items-center justify-center gap-2 rounded-full bg-[#ffd166] px-6 font-semibold text-[#03195b] shadow-[0_12px_34px_rgba(3,25,91,.25)] transition hover:bg-[#ffe199]">Проверить билет <ArrowRight size={19}/></a></div>
      </div></section>
      <div className="mx-auto max-w-7xl px-5 lg:px-8"><section id="search" className="scroll-mt-5 pt-14 sm:pt-20" aria-labelledby="search-title"><div className="mb-7 text-center"><p className="section-eyebrow">Проверьте свой билет</p><h2 id="search-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Когда лучше покупать?</h2><p className="mt-3 text-[#5d6c96]">Укажите параметры поездки или выберите готовый билет ниже.</p></div><div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(3,25,91,.09)]"><div className="h-2 bg-[linear-gradient(90deg,#3781fc,#1951fc)]"/><div className="p-5 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4"><div><p className="section-eyebrow">Поиск прогноза</p><h3 className="mt-2 text-2xl font-semibold">Ваш авиабилет</h3></div><div className="hidden rounded-2xl bg-[#e3f1ff] p-3 text-[#1951fc] sm:block"><TicketIcon size={24}/></div></div>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Откуда"><select value={form.originCode} onChange={(e) => set('originCode', e.target.value)}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></Field>
            <Field label="Куда"><select value={form.destinationCode} onChange={(e) => set('destinationCode', e.target.value)}>{cities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}</select></Field>
            <Field label="Дата вылета"><input required type="date" value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)}/></Field>
            <Field label="Обратно · необязательно"><input type="date" min={form.departureDate} value={form.returnDate ?? ''} onChange={(e) => set('returnDate', e.target.value || null)}/></Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Взрослые · от 12 лет"><input type="number" min="1" max="9" value={form.adults} onChange={(e) => set('adults', Number(e.target.value))}/></Field>
            <Field label="Дети · 2–11 лет"><input type="number" min="0" max="9" value={form.children} onChange={(e) => set('children', Number(e.target.value))}/></Field>
            <Field label="Младенцы · до 2 лет"><input type="number" min="0" max={form.adults} value={form.infants} onChange={(e) => set('infants', Number(e.target.value))}/></Field>
            <Field label="Класс обслуживания"><select value={form.cabinClass} onChange={(e) => set('cabinClass', e.target.value)}>{cabinClasses.map((value) => <option key={value} value={value}>{classNames[value]}</option>)}</select></Field>
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#e6eef9] pt-6 sm:flex-row sm:items-center"><p className="flex max-w-xl items-start gap-2 text-sm leading-5 text-[#5d6c96]"><Info size={17} className="mt-0.5 shrink-0"/> Прогноз доступен для подготовленных тестовых билетов. Выберите готовый пример ниже, чтобы быстро его проверить.</p><Button size="lg" disabled={loading} className="w-full gap-2 sm:w-auto">{loading ? 'Ищем прогноз…' : 'Показать прогноз'}<ArrowRight size={18}/></Button></div>
        </form>
      </div></div></section>
      <section id="forecast" aria-live="polite" className="mt-7 scroll-mt-6">{error && <div className="rounded-2xl border border-[#ffd9d9] bg-[#fff5f5] p-5 text-[#a03232]">{error}</div>}{result && <Forecast ticket={result}/>}</section>
      <section className="py-14 sm:py-20" aria-labelledby="catalog-title"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-eyebrow">Тестовые данные</p><h2 id="catalog-title" className="mt-2 text-3xl font-semibold">100 билетов для проверки</h2><p className="mt-2 text-[#5d6c96]">Выберите билет, чтобы сразу увидеть его прогноз и совет.</p></div><span className="w-fit rounded-full bg-[#e3f1ff] px-4 py-2 text-xs font-semibold text-[#1951fc]">{source === 'database' ? 'Данные из PostgreSQL' : 'Демо-режим'} · {tickets.length} билетов</span></div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-3.5 text-[#8da0b3]" size={18}/><input className="h-12 w-full rounded-xl border border-[#dbe6f7] bg-white pl-11 pr-4 outline-none focus:border-[#1951fc]" placeholder="Поиск города или кода аэропорта" value={query} onChange={(e) => { setQuery(e.target.value); setVisible(12); }}/></div><select aria-label="Направление цены" className="h-12 rounded-xl border border-[#dbe6f7] bg-white px-4 outline-none" value={directionFilter} onChange={(e) => { setDirectionFilter(e.target.value); setVisible(12); }}><option value="all">Любой прогноз</option><option value="up">Цена вырастет</option><option value="down">Цена снизится</option><option value="stable">Почти без изменений</option></select></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.slice(0, visible).map((ticket) => <button key={ticket.id} onClick={() => selectTicket(ticket)} className="ticket-card group min-w-0 rounded-[22px] bg-white p-5 text-left shadow-[0_6px_24px_rgba(3,25,91,.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(3,25,91,.13)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1951fc]"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wider text-[#5d6c96]">Билет №{ticket.id}</span><DirectionBadge ticket={ticket}/></div><div className="mt-4 flex min-w-0 items-center gap-2 text-lg font-bold"><span className="truncate">{cityName(ticket.originCode)}</span><ArrowRight size={17} className="shrink-0 text-[#1951fc]"/><span className="truncate">{cityName(ticket.destinationCode)}</span></div><div className="mt-2 flex items-center gap-2 text-sm text-[#5d6c96]"><CalendarDays size={15}/>{dateLabel(ticket.departureDate)}{ticket.returnDate && ` — ${dateLabel(ticket.returnDate)}`} · {classNames[ticket.cabinClass]}</div><div className="ticket-divider mx-1 mt-5 border-t-2 border-dashed border-[#dbe6f7]"/><div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-[#5d6c96]">Цена сейчас</p><p className="mt-1 text-xl font-semibold">{money(ticket.currentPriceRub)}</p></div><span className="flex items-center gap-1 text-sm font-semibold text-[#1951fc]">Смотреть <ChevronRight size={17}/></span></div></button>)}</div>
        {filtered.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-[#5d6c96]">Подходящих билетов нет. Измените поиск или фильтр.</p>}
        {visible < filtered.length && <div className="mt-7 text-center"><Button variant="outline" onClick={() => setVisible((n) => n + 12)}>Показать ещё · {filtered.length - visible}</Button></div>}
      </section></div>
    </main><footer className="bg-[#03195b] px-5 py-9 text-center text-sm leading-6 text-[#cbe9fd]">Чекбилет · Демонстрация на синтетических данных. Цены и прогнозы вымышлены, качество на реальных ценах пока не проверено.</footer>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactElement }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#03195b]">{label}</span>{<div className="field-control">{children}</div>}</label>; }

function DirectionBadge({ ticket }: { ticket: DisplayTicket }) {
  const up = ticket.direction === 'up'; const down = ticket.direction === 'down';
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : ArrowRight;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${up ? 'bg-[#ffe3e7] text-[#c8243a]' : down ? 'bg-[#dcf7ea] text-[#0f8a52]' : 'bg-[#fff3d4] text-[#9a6b00]'}`}><Icon size={14}/>{up ? 'Вырастет' : down ? 'Снизится' : 'Почти без изменений'}</span>;
}

function Forecast({ ticket }: { ticket: DisplayTicket }) {
  const up = ticket.direction === 'up'; const down = ticket.direction === 'down';
  const advice = up ? 'Покупайте сейчас' : down ? 'Лучше подождать' : 'Можно подождать';
  const reason = up ? `Тестовый сценарий предполагает рост цены на ${ticket.changePercent}% за 7 дней.` : down ? `Тестовый сценарий предполагает снижение цены на ${Math.abs(ticket.changePercent)}% за 7 дней.` : `Изменение на ${Math.abs(ticket.changePercent)}% укладывается в порог стабильности ±5%.`;
  return <div className="grid overflow-hidden rounded-[28px] border-[12px] border-[#cbe9fd] bg-white shadow-[0_14px_36px_rgba(3,25,91,.11)] lg:grid-cols-[1.25fr_.75fr]"><div className="p-6 sm:p-8"><div className="flex flex-wrap items-center gap-3"><span className="section-eyebrow">Прогноз на 7 дней</span><DirectionBadge ticket={ticket}/></div><h2 className="mt-5 text-2xl font-bold sm:text-3xl">{cityName(ticket.originCode)} → {cityName(ticket.destinationCode)}</h2><p className="mt-2 text-sm text-[#5d6c96]">Вылет {dateLabel(ticket.departureDate)}{ticket.returnDate && ` · обратно ${dateLabel(ticket.returnDate)}`} · {ticket.adults} взр.{ticket.children > 0 && ` · ${ticket.children} реб.`}{ticket.infants > 0 && ` · ${ticket.infants} мл.`} · {classNames[ticket.cabinClass]}</p><div className="mt-7 flex flex-wrap items-end gap-8"><div><p className="text-sm text-[#5d6c96]">Сейчас</p><p className="mt-1 text-3xl font-semibold">{money(ticket.currentPriceRub)}</p></div><ArrowRight className="mb-2 text-[#9aacbd]"/><div><p className="text-sm text-[#5d6c96]">В тестовом сценарии через 7 дней</p><p className={`mt-1 text-3xl font-semibold ${up ? 'text-[#c8243a]' : down ? 'text-[#0f8a52]' : 'text-[#9a6b00]'}`}>{money(ticket.predictedPriceRub)}</p></div></div><p className="mt-6 rounded-xl bg-[#f4faff] px-4 py-3 text-sm leading-6 text-[#49637c]">{reason}</p></div><div className="flex flex-col justify-center bg-[#e3f1ff] p-6 sm:p-8"><div className="mb-5 grid size-12 place-items-center rounded-full bg-white text-[#1951fc]"><span className="size-3 rounded-full bg-[#1951fc]"/></div><p className="section-eyebrow">Наш совет</p><h3 className="mt-2 text-3xl font-semibold">{advice}</h3><p className="mt-3 text-sm leading-6 text-[#4f6c88]">Совет основан на тестовом прогнозе. Реальная цена может измениться иначе.</p></div></div>;
}
