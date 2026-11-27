'use client';

import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPinned,
  PanelLeftClose,
  PanelLeftOpen,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { ApiError, obterUsuarioLogado, type UsuarioLogado } from '@/lib/api';
import { encerrarSessao, obterToken } from '@/lib/sessao';
import { ROTA_EQUIPE_CAMPO, UsuarioProvider, ehEquipeDeCampo, useSessaoPainel } from './UsuarioContexto';

interface ItemMenu {
  titulo: string;
  href: string;
  Icone: LucideIcon;
  emBreve?: boolean; // módulo ainda sem página: aparece desabilitado
}

// Botões do menu maiores que o padrão do shadcn (h-8 / text-sm)
const BOTAO_MENU = 'h-11 gap-3 px-3 text-[15px] [&>svg]:size-5';

// Mesma ordem do design (Figma): Dashboard, Ocorrências, Mapa de Calor, Equipes
const ITENS_CENTRAL: ItemMenu[] = [
  { titulo: 'Dashboard', href: '/admin', Icone: LayoutDashboard },
  { titulo: 'Ocorrências', href: '/admin/ocorrencias', Icone: ClipboardList },
  { titulo: 'Mapa de Calor', href: '/admin/mapa-de-calor', Icone: MapPinned },
  { titulo: 'Equipes', href: '/admin/equipes', Icone: Users },
];

// Quem é da equipe de campo só vê os próprios atendimentos
const ITENS_EQUIPE_CAMPO: ItemMenu[] = [{ titulo: 'Minha equipe', href: ROTA_EQUIPE_CAMPO, Icone: Truck }];

const itensDoUsuario = (u: UsuarioLogado) => (ehEquipeDeCampo(u) ? ITENS_EQUIPE_CAMPO : ITENS_CENTRAL);

const ROTULO_PERFIL: Record<string, string> = {
  COORDENADOR: 'Coordenação',
  ATENDENTE: 'Atendimento',
  EQUIPE_CAMPO: 'Equipe de campo',
};

// /admin só é ativo na raiz; os demais também valem para subrotas
function estaAtivo(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

function Navegacao() {
  const pathname = usePathname();
  const { usuario, sair } = useSessaoPainel();
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar();
  const recolhida = !isMobile && state === 'collapsed';
  const itens = itensDoUsuario(usuario);

  return (
    <>
      <SidebarHeader className="px-3 py-5">
        <Link
          href={itens[0].href}
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
              {itens.map(({ titulo, href, Icone, emBreve }) => {
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
function tituloDaPagina(pathname: string, itens: ItemMenu[]) {
  return itens.find((i) => estaAtivo(pathname, i.href))?.titulo ?? 'Painel';
}

function Topbar() {
  const pathname = usePathname();
  const { usuario } = useSessaoPainel();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8">
      {/* O hambúrguer só aparece em telas pequenas */}
      <SidebarTrigger aria-label="Abrir menu" className="md:hidden" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate font-heading text-base text-foreground">{tituloDaPagina(pathname, itensDoUsuario(usuario))}</p>
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
      <div className="hidden min-w-0 text-right leading-tight sm:block">
        <p className="max-w-40 truncate text-sm font-medium text-foreground">{usuario.nome}</p>
        <p className="text-xs text-muted-foreground">{ROTULO_PERFIL[usuario.perfil] ?? usuario.perfil}</p>
      </div>
      <span
        aria-label={`Conectado como ${usuario.nome}`}
        title={usuario.email}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-primary-foreground"
      >
        {usuario.nome.trim().charAt(0) || 'A'}
      </span>
    </header>
  );
}

type Carga =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; token: string; usuario: UsuarioLogado }
  | { tipo: 'erro'; mensagem: string };

export default function PainelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [carga, setCarga] = useState<Carga>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  const sair = useCallback(() => {
    encerrarSessao();
    router.replace('/admin/login');
  }, [router]);

  // Sem sessão válida, volta para o login; com sessão, descobre quem é e qual o perfil
  useEffect(() => {
    const token = obterToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    const controle = new AbortController();
    obterUsuarioLogado(token, controle.signal)
      .then((usuario) => setCarga({ tipo: 'ok', token, usuario }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return sair();
        setCarga({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [router, sair, tentativa]);

  // Equipe de campo só acessa a própria tela
  const usuario = carga.tipo === 'ok' ? carga.usuario : null;
  const foraDaArea = usuario !== null && ehEquipeDeCampo(usuario) && !estaAtivo(pathname, ROTA_EQUIPE_CAMPO);
  useEffect(() => {
    if (foraDaArea) router.replace(ROTA_EQUIPE_CAMPO);
  }, [foraDaArea, router]);

  const sessao = useMemo(
    () => (carga.tipo === 'ok' ? { token: carga.token, usuario: carga.usuario, sair } : null),
    [carga, sair],
  );

  if (carga.tipo === 'erro') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="font-heading text-lg text-foreground">Não foi possível abrir o painel</p>
        <p className="max-w-sm text-sm text-muted-foreground">{carga.mensagem}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCarga({ tipo: 'carregando' });
              setTentativa((t) => t + 1);
            }}
          >
            Tentar de novo
          </Button>
          <Button variant="ghost" onClick={sair}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (!sessao || foraDaArea) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <UsuarioProvider value={sessao}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <Navegacao />
        </Sidebar>
        <SidebarInset className="bg-background">
          <Topbar />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </UsuarioProvider>
  );
}
