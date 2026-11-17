import type { Metadata } from 'next';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BarraLateral } from './_components/barra-lateral';
import { CabecalhoPainel } from './_components/cabecalho-painel';
import { ProvedorSessao } from './_components/sessao';

export const metadata: Metadata = {
  title: 'Painel Administrativo — Instituto Caapora',
  robots: { index: false, follow: false },
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProvedorSessao>
      <SidebarProvider>
        <BarraLateral />
        <SidebarInset className="min-w-0">
          <CabecalhoPainel />
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ProvedorSessao>
  );
}
