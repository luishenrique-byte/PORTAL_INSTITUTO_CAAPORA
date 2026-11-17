'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { rotuloPerfil } from '@/lib/ocorrencia';
import { useSessao } from './sessao';

const PAGINAS: [string, string][] = [
  ['/admin/ocorrencias/nova', 'Nova ocorrência'],
  ['/admin/ocorrencias/', 'Detalhes da ocorrência'],
  ['/admin/ocorrencias', 'Ocorrências'],
  ['/admin/mapa', 'Mapa de calor'],
  ['/admin/equipes', 'Equipes'],
  ['/admin/relatorios', 'Relatórios'],
  ['/admin/funcionarios', 'Funcionários'],
  ['/admin', 'Dashboard'],
];

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes.at(-1)![0] : '')).toUpperCase();
}

// Barra do topo: recolher menu, página atual, atalho para o site público e usuário logado
export function CabecalhoPainel() {
  const pathname = usePathname();
  const { usuario, perfil } = useSessao();
  const pagina = PAGINAS.find(([prefixo]) => pathname.startsWith(prefixo))?.[1] ?? 'Painel';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur md:px-6 print:hidden">
      <SidebarTrigger className="-ml-1" aria-label="Recolher ou expandir menu" />
      <Separator orientation="vertical" className="h-5" />
      <nav aria-label="Você está em" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Painel interno</span>
        <span className="hidden text-muted-foreground/60 sm:inline" aria-hidden>
          /
        </span>
        <span className="truncate font-medium text-foreground" aria-current="page">
          {pagina}
        </span>
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          Site público <ExternalLink className="size-3.5" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right leading-tight md:block">
            <p className="text-sm font-medium text-foreground">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground">{rotuloPerfil(perfil)}</p>
          </div>
          <span
            className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            title={`${usuario.nome} · ${usuario.email}`}
          >
            {iniciais(usuario.nome)}
          </span>
        </div>
      </div>
    </header>
  );
}
