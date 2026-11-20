'use client';

import { ClipboardList, ExternalLink, LayoutDashboard, LogOut, Map, Users, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

// Estrutura comum das telas do painel: menu lateral + cabeçalho + conteúdo.
// Uso: <DashboardLayout pagina="Dashboard" token={token} aoSair={sair}>...</DashboardLayout>
export function DashboardLayout({
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
      <MenuLateral aoSair={aoSair} />
      <SidebarInset className="min-w-0">
        <Cabecalho pagina={pagina} token={token} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

interface ItemMenu {
  href: string;
  rotulo: string;
  Icone: LucideIcon;
  pronta: boolean; // false = módulo ainda não existe na branch dev
}

// Quando um módulo ficar pronto, basta trocar "pronta" para true
const MODULOS: ItemMenu[] = [
  { href: '/admin/dashboard', rotulo: 'Dashboard', Icone: LayoutDashboard, pronta: true },
  { href: '/admin/ocorrencias', rotulo: 'Ocorrências', Icone: ClipboardList, pronta: false },
  { href: '/admin/mapa', rotulo: 'Mapa de Calor', Icone: Map, pronta: false },
  { href: '/admin/equipes', rotulo: 'Equipes', Icone: Users, pronta: true },
];

function MenuLateral({ aoSair }: { aoSair: () => void }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
          <Image src="/logo-caapora.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
          <span className="leading-tight whitespace-nowrap group-data-[collapsible=icon]:hidden">
            <span className="block font-heading text-base text-sidebar-foreground">Instituto Caapora</span>
            <span className="block text-xs text-sidebar-foreground/60">Painel administrativo</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MODULOS.map(({ href, rotulo, Icone, pronta }) => (
                <SidebarMenuItem key={href}>
                  {pronta ? (
                    <SidebarMenuButton
                      asChild
                      tooltip={rotulo}
                      isActive={pathname === href}
                      className="h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                    >
                      <Link href={href} onClick={() => setOpenMobile(false)}>
                        <Icone />
                        <span>{rotulo}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <>
                      <SidebarMenuButton disabled tooltip={`${rotulo} (em breve)`} className="h-9 text-sidebar-foreground/45">
                        <Icone />
                        <span>{rotulo}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="text-[0.65rem] text-sidebar-foreground/45">em breve</SidebarMenuBadge>
                    </>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={aoSair} className="h-9 text-sidebar-foreground/80">
              <LogOut />
              <span>Sair do sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// O backend não tem rota com os dados do usuário logado; o JWT traz o e-mail no campo "sub"
function emailDoToken(token: string) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(payload)) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

function Cabecalho({ pagina, token }: { pagina: string; token: string }) {
  const email = emailDoToken(token);

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
            {email?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      </div>
    </header>
  );
}
