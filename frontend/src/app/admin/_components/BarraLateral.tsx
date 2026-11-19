'use client';

import { ClipboardList, LayoutDashboard, LogOut, Map, Users, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface ItemMenu {
  href: string;
  rotulo: string;
  Icone: LucideIcon;
  pronta: boolean; // false = tela ainda em desenvolvimento por outro integrante
}

// Quando uma tela ficar pronta, basta trocar "pronta" para true
const ITENS: ItemMenu[] = [
  { href: '/admin', rotulo: 'Dashboard', Icone: LayoutDashboard, pronta: true },
  { href: '/admin/ocorrencias', rotulo: 'Ocorrências', Icone: ClipboardList, pronta: false },
  { href: '/admin/mapa', rotulo: 'Mapa de Calor', Icone: Map, pronta: false },
  { href: '/admin/equipes', rotulo: 'Equipes', Icone: Users, pronta: true },
];

export function BarraLateral({ aoSair }: { aoSair: () => void }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden" aria-label="Instituto Caapora — Dashboard">
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
              {ITENS.map(({ href, rotulo, Icone, pronta }) => (
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
                      <SidebarMenuButton
                        disabled
                        tooltip={`${rotulo} (em breve)`}
                        className="h-9 text-sidebar-foreground/45"
                      >
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
