// Formats a price in rubles: 10150 -> "10 150 ₽" (no-break space as thousands separator).
export const formatRub = (value: number): string =>
  `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")} ₽`;

// Demo data shown on the landing (illustration only, not real prices).
export const DEMO = {
  from: { code: "MOW", city: "Москва" },
  to: { code: "AER", city: "Сочи" },
  trip: "12–19 дек · 2 пасс.",
  price: "10 150 ₽",
  boughtYesterdayRub: 10150,
  todayRub: 8940,
  chartTitle: "Москва → Сочи · прогноз 7 дней",
};

// Forecast states: 0 = goes down, 1 = goes up, 2 = no change.
export type ForecastState = 0 | 1 | 2;

export interface Forecast {
  arrow: string;
  label: string;
  listLabel: string;
  delta: string;
  advice: string;
  bars: number[]; // bar heights, % of chart height
}

export const FORECASTS: Forecast[] = [
  {
    arrow: "↘",
    label: "Снизится",
    listLabel: "Снизится",
    delta: "−12%",
    advice: "Лучше подождать",
    bars: [50, 58, 62, 70, 66, 60, 52, 46, 40, 36],
  },
  {
    arrow: "↗",
    label: "Вырастет",
    listLabel: "Вырастет",
    delta: "+18%",
    advice: "Покупайте сейчас",
    bars: [40, 44, 50, 48, 56, 62, 70, 78, 86, 96],
  },
  {
    arrow: "→",
    label: "Без изменений",
    listLabel: "Останется примерно такой же",
    delta: "±2%",
    advice: "Можно не спешить",
    bars: [56, 60, 58, 62, 57, 60, 59, 61, 58, 60],
  },
];

// Order of rows in the solution list.
export const LIST_ORDER: ForecastState[] = [1, 0, 2];

// Number of leading bars that show price history (the rest is the forecast).
export const HISTORY_BARS = 3;

export const CYCLE_MS = 2800;
