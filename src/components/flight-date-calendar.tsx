'use client';

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { TicketInput } from '@/lib/demo-data';
import { Button } from './ui/button';

export type FlightDates = Pick<TicketInput, 'departureDate' | 'returnDate'>;
export type DateFieldName = 'departure' | 'return';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const monthFormat = new Intl.DateTimeFormat('ru-RU', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
});
const accessibleDate = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'full', timeZone: 'UTC',
});
const fromDate = (value: string) => new Date(value + 'T00:00:00Z');
const toDate = (value: Date) => value.toISOString().slice(0, 10);
const monthStart = (value: string) => value.slice(0, 7) + '-01';
const offsetMonth = (value: string, offset: number) => {
  const date = fromDate(value);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date;
};
const dayKeys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

function todayDate() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

type Props = {
  value: FlightDates;
  field: DateFieldName;
  trigger: HTMLButtonElement;
  onConfirm: (dates: FlightDates) => void;
  onClose: () => void;
};

export function FlightDateCalendar({ value, field, trigger, onConfirm, onClose }: Props) {
  const titleId = useId();
  const monthId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const focusDay = useRef<string | null>(null);
  const [today] = useState(todayDate);
  const [departure, setDeparture] = useState(value.departureDate >= today ? value.departureDate : '');
  const [returnDate, setReturnDate] = useState(value.returnDate && value.returnDate >= today ? value.returnDate : null);
  const [roundTrip, setRoundTrip] = useState(field === 'return' || Boolean(value.returnDate));
  const [activeField, setActiveField] = useState<DateFieldName>(field === 'return' && departure ? 'return' : 'departure');
  const [month, setMonth] = useState(monthStart((activeField === 'return' && returnDate) || departure || today));
  const [direction, setDirection] = useState(0);
  const [focusedDay, setFocusedDay] = useState('');
  const [confirming, setConfirming] = useState(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.setProperty('--date-calendar-scroll', `-${scrollY}px`);
    document.body.style.setProperty('--date-calendar-gutter', `${gutter}px`);
    document.documentElement.classList.add('date-calendar-open');
    dialog.showModal();
    return () => {
      window.clearTimeout(closeTimer.current);
      document.documentElement.classList.remove('date-calendar-open');
      document.body.style.removeProperty('--date-calendar-scroll');
      document.body.style.removeProperty('--date-calendar-gutter');
      dialog.close();
      window.scrollTo({ top: scrollY, left: scrollX, behavior: 'instant' });
      trigger.focus({ preventScroll: true });
    };
  }, [trigger]);

  useLayoutEffect(() => {
    if (!focusDay.current) return;
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-date="' + focusDay.current + '"]')?.focus();
    focusDay.current = null;
  }, [focusedDay, month]);

  function close(confirm = false) {
    const dialog = dialogRef.current;
    if (!dialog || closeTimer.current !== undefined) return;
    const finish = () => {
      if (confirm) onConfirm({ departureDate: departure, returnDate: roundTrip ? returnDate : null });
      onClose();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    if (confirm) setConfirming(true);
    dialog.classList.add('is-closing');
    closeTimer.current = window.setTimeout(finish, 270);
  }

  function showMonth(next: string) {
    if (next === month) return;
    setDirection(next > month ? 1 : -1);
    setMonth(next);
  }

  function editDeparture() {
    setActiveField('departure');
    showMonth(monthStart(departure || today));
  }

  function selectDate(date: string) {
    if (closeTimer.current !== undefined) return;
    if (roundTrip && activeField === 'return' && departure) {
      setReturnDate(date);
      setActiveField('departure');
    } else {
      setDeparture(date);
      if (returnDate && date > returnDate) setReturnDate(null);
      if (roundTrip) setActiveField('return');
    }
  }

  const firstDay = fromDate(month);
  const leadingDays = (firstDay.getUTCDay() + 6) % 7;
  const nextMonthDate = offsetMonth(month, 1);
  const monthLength = new Date(nextMonthDate.getTime() - 86_400_000).getUTCDate();
  const earliest = roundTrip && activeField === 'return' && departure ? departure : today;
  const maxDate = '9999-12-31';
  const selectedDay = (activeField === 'return' && returnDate) || departure;
  const defaultDay = monthStart(selectedDay || today) === month && selectedDay >= earliest ? selectedDay : (earliest > month ? earliest : month);
  const monthLabel = monthFormat.formatToParts(firstDay).filter(({ type }) => type === 'month' || type === 'year').map(({ value }) => value).join(' ');
  const tabDay = monthStart(focusedDay) === month && focusedDay >= earliest ? focusedDay : defaultDay;

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const offset = dayKeys[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const next = fromDate(date);
    next.setUTCDate(next.getUTCDate() + offset);
    if (next.getUTCFullYear() > 9999) return;
    const nextDay = toDate(next);
    if (nextDay < earliest) return;
    focusDay.current = nextDay;
    setFocusedDay(nextDay);
    showMonth(monthStart(nextDay));
  }

  return <dialog
    ref={dialogRef}
    className="flight-date-dialog"
    aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); close(); }}
    onClick={(event) => { if (event.target === event.currentTarget) close(); }}
  >
    <div className="flight-date-sheet">
      <header className="flight-date-header">
        <span className="flight-date-handle" aria-hidden="true"/>
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-2xl font-bold tracking-tight">Выберите даты</h2>
          <button type="button" autoFocus aria-label="Закрыть календарь" className="flight-date-icon action-control" onClick={() => close()}><X size={22}/></button>
        </div>
      </header>

      <div className="flight-date-main">
        <div className="flight-date-controls">
          <div className="flight-date-modes" role="group" aria-label="Тип поездки" data-round-trip={roundTrip}>
            <button type="button" aria-pressed={!roundTrip} onClick={() => { setRoundTrip(false); editDeparture(); }}>Только туда</button>
            <button type="button" aria-pressed={roundTrip} onClick={() => { if (!roundTrip) editDeparture(); setRoundTrip(true); }}>Туда и обратно</button>
          </div>
        </div>

        <div className="flight-date-scroll">
          <div className="flight-date-month">
            <h3 id={monthId} aria-live="polite">{monthLabel[0].toUpperCase() + monthLabel.slice(1)}</h3>
            <div className="flex gap-1.5">
              <button type="button" aria-label="Предыдущий месяц" disabled={month <= monthStart(earliest)} className="flight-date-icon flight-date-arrow action-control" onClick={() => showMonth(toDate(offsetMonth(month, -1)))}><ChevronLeft size={22}/></button>
              <button type="button" aria-label="Следующий месяц" disabled={month === monthStart(maxDate)} className="flight-date-icon flight-date-arrow action-control" onClick={() => showMonth(toDate(nextMonthDate))}><ChevronRight size={22}/></button>
            </div>
          </div>
          <div className="flight-date-grid flight-date-weekdays" aria-hidden="true">
            {weekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div key={month} className="flight-date-grid flight-date-days" data-direction={direction} role="group" aria-labelledby={monthId}>
            {Array.from({ length: leadingDays }, (_, index) => <span key={'empty-' + index} aria-hidden="true"/>)}
            {Array.from({ length: monthLength }, (_, index) => {
              const day = index + 1;
              const value = month.slice(0, 8) + String(day).padStart(2, '0');
              const end = roundTrip ? returnDate : null;
              const selected = value === departure || value === end;
              const connectsLeft = Boolean(end && value > departure && value <= end);
              const connectsRight = Boolean(end && value >= departure && value < end);
              return <div key={value} className="flight-date-cell" data-from={connectsLeft} data-to={connectsRight}>
                <button type="button" data-date={value} aria-label={accessibleDate.format(fromDate(value))} aria-current={value === today ? 'date' : undefined}
                  aria-pressed={selected} disabled={value < earliest} tabIndex={value === tabDay ? 0 : -1}
                  onFocus={() => setFocusedDay(value)} onKeyDown={(event) => moveFocus(event, value)} onClick={() => selectDate(value)}>
                  {day}
                </button>
              </div>;
            })}
          </div>
        </div>
      </div>

      <footer className="flight-date-footer">
        <Button type="button" disabled={!departure} aria-busy={confirming} onClick={() => close(true)} className="h-12 w-full rounded-2xl text-base">Готово</Button>
      </footer>
    </div>
  </dialog>;
}
