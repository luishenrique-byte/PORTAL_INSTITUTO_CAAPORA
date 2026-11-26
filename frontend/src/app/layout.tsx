import type { Metadata } from 'next';
import { Instrument_Sans, Young_Serif } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// As fontes são baixadas no build e servidas pelo próprio site (next/font).
// As variáveis abaixo alimentam --font-display e --font-body no globals.css.
const fonteTitulos = Young_Serif({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-young-serif',
});

const fonteTexto = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-sans',
});

export const metadata: Metadata = {
  title: 'Instituto Caapora | Proteção da fauna silvestre',
  description:
    'Proteção e resgate de animais silvestres brasileiros. Conheça o Instituto Caapora e saiba como ajudar.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fonteTitulos.variable} ${fonteTexto.variable}`}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" position="top-center" richColors />
      </body>
    </html>
  );
}
