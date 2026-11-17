import { CYCLE_MS, FORECASTS } from "../data/forecast";

// Cycles the demo forecast state: 0 (down) → 1 (up) → 2 (no change).
// One state drives the hero ticket, the chart and the list highlight.
export function initForecastCycle(): void {
  const root = document.querySelector<HTMLElement>("[data-forecast-root]");
  if (!root) return;

  const bars = Array.from(root.querySelectorAll<HTMLElement>("[data-bar]"));
  const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
  const fields = Array.from(root.querySelectorAll<HTMLElement>("[data-f]"));

  const apply = (i: number): void => {
    const f = FORECASTS[i];
    root.dataset.fc = String(i);
    for (const el of fields) {
      const key = el.dataset.f as "arrow" | "label" | "delta" | "advice";
      el.textContent = f[key];
    }
    bars.forEach((bar, n) => {
      bar.style.height = `${f.bars[n]}%`;
    });
    for (const row of rows) {
      row.toggleAttribute("data-active", Number(row.dataset.row) === i);
    }
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply(0);
    return;
  }

  let state = 0;
  let timer: number | undefined;
  const start = (): void => {
    if (timer !== undefined) return;
    timer = window.setInterval(() => {
      state = (state + 1) % FORECASTS.length;
      apply(state);
    }, CYCLE_MS);
  };
  const stop = (): void => {
    window.clearInterval(timer);
    timer = undefined;
  };

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}
