import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Survey Product',
  description: 'MVP для AI-опросников на Groq и Postgres',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
