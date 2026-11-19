'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BarraLateral } from './BarraLateral';
import { CabecalhoPainel } from './CabecalhoPainel';

// Estrutura comum das telas do painel: menu lateral + cabeçalho + conteúdo da página.
// Uso: <PainelAdmin pagina="Equipes" token={token} aoSair={sair}>...conteúdo...</PainelAdmin>
export function PainelAdmin({
  pagina,
  token,
  aoSair,
  children,
}: {
  pagina: string;
  token: string;
  aoSair: () => void;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <BarraLateral aoSair={aoSair} />
      <SidebarInset className="min-w-0">
        <CabecalhoPainel pagina={pagina} token={token} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
