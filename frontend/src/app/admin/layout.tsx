"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Flame,
  Users,
  LogOut,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Ocorrências", href: "/admin/ocorrencias", icon: AlertTriangle },
  { label: "Mapa de Calor", href: "/admin/mapa", icon: Flame },
  { label: "Equipes", href: "/admin/equipes", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usuarioNome, setUsuarioNome] = useState("Colaborador");

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    const nomeSalvo = localStorage.getItem("usuario_nome");
    if (nomeSalvo) {
      setUsuarioNome(nomeSalvo);
    } else {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.nome || payload?.sub) {
          setUsuarioNome(payload.nome || payload.sub);
        }
      } catch {
        // mantém fallback
      }
    }
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const moduloAtual =
    NAV_ITEMS.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    )?.label || "Painel Administrativo";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_nome");
    sessionStorage.clear();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Menu Lateral (Sidebar) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-emerald-950 text-white transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Identificação Visual Instituto Caaporã */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-emerald-900">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo-caapora.png"
              alt="Instituto Caaporã"
              className="h-9 w-9 rounded-md object-contain bg-white p-1 shrink-0"
            />
            {!collapsed && (
              <div className="leading-tight truncate">
                <p className="font-bold text-sm tracking-wide">Instituto Caaporã</p>
                <span className="text-[11px] text-emerald-300">Gestão Ambiental</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-emerald-300 hover:text-white hover:bg-emerald-900"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-emerald-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-emerald-100 hover:bg-emerald-900/70 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Botão Sair */}
        <div className="p-3 border-t border-emerald-900">
          <button
            onClick={handleLogout}
            title={collapsed ? "Sair do sistema" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-950/60 hover:text-red-200 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair do sistema</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho Superior */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs text-slate-500">Painel Administrativo</p>
              <h1 className="text-lg font-semibold text-slate-800">{moduloAtual}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <span>Site Público</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <UserCircle className="h-6 w-6 text-emerald-700" />
              <span className="hidden sm:inline font-medium max-w-[160px] truncate">
                {usuarioNome}
              </span>
            </div>
          </div>
        </header>

        {/* Área da Página */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}