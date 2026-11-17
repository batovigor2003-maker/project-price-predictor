# Лендинг Чекбилет

Статичный одностраничный лендинг (Astro + Tailwind CSS 4). Макет и тексты — в папке `design/`.

## Запуск

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # готовый сайт в папке dist/
```

## Настройка

Адрес приложения, куда ведут все кнопки «Проверить билет», задаётся в `.env`:

```
PUBLIC_APP_URL=https://адрес-приложения
```

По умолчанию кнопки ведут на `https://app.checkbilet.ru`. Демо-данные (маршрут, цены, прогнозы) — в `src/data/forecast.ts`.
