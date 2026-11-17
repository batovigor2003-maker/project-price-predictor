import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Чекбилет — когда покупать авиабилет',
  description: 'Демонстрационный прогноз изменения цены авиабилета на ближайшие 7 дней.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
