import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Instituto Caapora | Proteção da fauna silvestre',
  description:
    'Proteção e resgate de animais silvestres brasileiros. Conheça o Instituto Caapora e saiba como ajudar.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
