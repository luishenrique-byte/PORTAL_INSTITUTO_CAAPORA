'use client';

import {
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Map,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { rotuloPerfil } from '@/lib/ocorrencia';
import type { Perfil } from '@/lib/painel';
import { iniciais } from './cabecalho-painel';
import { useSessao } from './sessao';

interface Item {
  href: string;
  rotulo: string;
  Icone: LucideIcon;
  perfis: Perfil[];
}

const TODOS: Perfil[] = ['COORDENADOR', 'ATENDENTE', 'EQUIPE_CAMPO'];
const CENTRAL: Perfil[] = ['COORDENADOR', 'ATENDENTE'];

// Mesmas permissões do SecurityConfig do backend
const OPERACAO: Item[] = [
  { href: '/admin', rotulo: 'Dashboard', Icone: LayoutDashboard, perfis: CENTRAL },
  { href: '/admin/ocorrencias', rotulo: 'Ocorrências', Icone: ClipboardList, perfis: TODOS },
  { href: '/admin/mapa', rotulo: 'Mapa de calor', Icone: Map, perfis: CENTRAL },
  { href: '/admin/equipes', rotulo: 'Equipes', Icone: Users, perfis: TODOS },
];

const GESTAO: Item[] = [
  { href: '/admin/relatorios', rotulo: 'Relatórios', Icone: FileBarChart, perfis: CENTRAL },
  { href: '/admin/funcionarios', rotulo: 'Funcionários', Icone: UserCog, perfis: ['COORDENADOR'] },
];

export function BarraLateral() {
  const { usuario, perfil, pode, sair } = useSessao();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const ativo = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  function grupo(titulo: string, itens: Item[]) {
    const visiveis = itens.filter((i) => pode(...i.perfis));
    if (!visiveis.length) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground/50">{titulo}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visiveis.map(({ href, rotulo, Icone }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  tooltip={rotulo}
                  isActive={ativo(href)}
                  className="h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                >
                  <Link href={href} onClick={() => setOpenMobile(false)}>
                    <Icone />
                    <span>{rotulo}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader className="px-3 pt-4 pb-3 group-data-[collapsible=icon]:px-2">
        <Link
          href={perfil === 'EQUIPE_CAMPO' ? '/admin/ocorrencias' : '/admin'}
          className="flex items-center gap-3 overflow-hidden"
          aria-label="Instituto Caapora — início do painel"
        >
          <Image src="/logo-caapora.png" alt="" width={36} height={36} className="h-8 w-8 shrink-0 object-contain" />
          <span className="leading-tight whitespace-nowrap group-data-[collapsible=icon]:hidden">
            <span className="block font-heading text-[1.05rem] text-sidebar-foreground">Caapora</span>
            <span className="block text-xs text-sidebar-foreground/60">Painel da equipe</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {grupo('Operação', OPERACAO)}
        {grupo('Gestão', GESTAO)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-3 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {iniciais(usuario.nome)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{usuario.nome}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{rotuloPerfil(perfil)}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={sair} className="h-9 text-sidebar-foreground/80">
              <LogOut />
              <span>Sair do sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
