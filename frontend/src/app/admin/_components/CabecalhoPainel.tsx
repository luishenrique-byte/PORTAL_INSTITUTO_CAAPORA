'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

// O backend ainda não tem rota com os dados do usuário logado (nome e perfil).
// O token JWT traz o e-mail no campo "sub", então ele é usado para identificar quem entrou.
function emailDoToken(token: string) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(payload)) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

export function CabecalhoPainel({ pagina, token }: { pagina: string; token: string }) {
  const email = emailDoToken(token);
  const inicial = email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Recolher ou expandir o menu" />
      <Separator orientation="vertical" className="h-5" />

      <p className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Painel administrativo</span>
        <span className="hidden text-muted-foreground/60 sm:inline" aria-hidden>
          /
        </span>
        <span className="truncate font-medium text-foreground">{pagina}</span>
      </p>

      <div className="ml-auto flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          Site público <ExternalLink className="size-3.5" />
        </Link>
        <div className="flex items-center gap-2.5">
          {email && <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>}
          <span
            className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            title={email ?? 'Usuário conectado'}
          >
            {inicial}
          </span>
        </div>
      </div>
    </header>
  );
}
