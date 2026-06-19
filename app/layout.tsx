import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Proji Growth Score — диагностика бизнеса',
  description: 'Пройдите 11 вопросов и узнайте, где ваш бизнес теряет деньги, процессы и скорость роста.',
  openGraph: {
    title: 'Proji Growth Score',
    description: '11 вопросов — персональный план роста для вашего бизнеса',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
