import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Чекбилет — когда покупать авиабилет',
  description: 'Демонстрационный прогноз изменения цены авиабилета на ближайшие 7 дней.',
};

export const viewport: Viewport = { viewportFit: 'cover', interactiveWidget: 'resizes-content' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
