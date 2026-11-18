import { CYCLE_MS, FORECASTS } from "../data/forecast";

// Show each demo forecast state once.
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

  for (let state = 1; state < FORECASTS.length; state += 1) {
    window.setTimeout(() => apply(state), CYCLE_MS * state);
  }
}
