'use client';

import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPinned,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import { encerrarSessao, obterToken } from '@/lib/sessao';

interface ItemMenu {
  titulo: string;
  href: string;
  Icone: LucideIcon;
  emBreve?: boolean; // módulo ainda sem página: aparece desabilitado
}

// Botões do menu maiores que o padrão do shadcn (h-8 / text-sm)
const BOTAO_MENU = 'h-11 gap-3 px-3 text-[15px] [&>svg]:size-5';

// Mesma ordem do design (Figma): Dashboard, Ocorrências, Mapa de Calor, Equipes
const ITENS: ItemMenu[] = [
  { titulo: 'Dashboard', href: '/admin', Icone: LayoutDashboard },
  { titulo: 'Ocorrências', href: '/admin/ocorrencias', Icone: ClipboardList, emBreve: true },
  { titulo: 'Mapa de Calor', href: '/admin/mapa-de-calor', Icone: MapPinned, emBreve: true },
  { titulo: 'Equipes', href: '/admin/equipes', Icone: Users },
];

// /admin só é ativo na raiz; os demais também valem para subrotas
function estaAtivo(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

function Navegacao() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar();
  const recolhida = !isMobile && state === 'collapsed';

  function sair() {
    encerrarSessao();
    router.replace('/admin/login');
  }

  return (
    <>
      <SidebarHeader className="px-3 py-5">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 px-1"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <Image src="/logo-caapora.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
          <span className="whitespace-nowrap font-heading text-base leading-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Instituto Caapora
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITENS.map(({ titulo, href, Icone, emBreve }) => {
                const ativo = estaAtivo(pathname, href);
                return (
                  <SidebarMenuItem key={href}>
                    {emBreve ? (
                      <>
                        <SidebarMenuButton disabled aria-disabled tooltip={`${titulo} (em breve)`} className={`${BOTAO_MENU} opacity-50`}>
                          <Icone /> <span>{titulo}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="peer-data-[size=default]/menu-button:top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide">Em breve</SidebarMenuBadge>
                      </>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={ativo}
                        className={BOTAO_MENU}
                        tooltip={titulo}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <Link href={href} aria-current={ativo ? 'page' : undefined}>
                          <Icone /> <span>{titulo}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          {/* Recolher só faz sentido no desktop; no mobile o menu é um drawer */}
          {!isMobile && (
            <SidebarMenuItem>
              <SidebarMenuButton className={BOTAO_MENU} onClick={toggleSidebar} tooltip={recolhida ? 'Expandir' : undefined}>
                {recolhida ? <PanelLeftOpen /> : <PanelLeftClose />} <span>Recolher</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton className={BOTAO_MENU} onClick={sair} tooltip="Sair">
              <LogOut /> <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

// Título da topbar por rota (o item do menu cobre subrotas)
function tituloDaPagina(pathname: string) {
  return ITENS.find((i) => estaAtivo(pathname, i.href))?.titulo ?? 'Painel';
}

function Topbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8">
      {/* O hambúrguer só aparece em telas pequenas */}
      <SidebarTrigger aria-label="Abrir menu" className="md:hidden" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate font-heading text-base text-foreground">{tituloDaPagina(pathname)}</p>
        <p className="truncate text-xs text-muted-foreground">Instituto Caapora · Painel Interno</p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ExternalLink className="size-3.5" />
        <span className="hidden sm:inline">Ver site público</span>
        <span className="sr-only sm:hidden">Ver site público</span>
      </Link>
      <span
        aria-label="Conta administrativa"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        A
      </span>
    </header>
  );
}

export default function PainelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  // Sem sessão válida, volta para o login
  useEffect(() => {
    if (obterToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
      setAutorizado(true);
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  if (!autorizado) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <Navegacao />
      </Sidebar>
      <SidebarInset className="bg-background">
        <Topbar />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
