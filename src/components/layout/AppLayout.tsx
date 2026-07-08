import { useTheme } from "@/lib/theme";
import { Outlet } from "react-router-dom";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

/**
 * AppLayout
 * -----------------------------------------------------------------------------
 * Shell principal das rotas autenticadas. Compõe:
 *   [ Sidebar (desktop fixo / mobile drawer) ] + [ TopBar + <Outlet/> ]
 *
 * O comportamento responsivo é orquestrado pelo `SidebarProvider`
 * (ver `sidebar-context.tsx`).
 */
export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <MobileBackdrop />
        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <TopBar />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

/**
 * Backdrop escuro exibido atrás do drawer no mobile.
 * Cobrir toda a tela permite fechar por clique fora (o próprio `Sidebar` já
 * escuta click-outside, mas o backdrop reforça a affordance visual).
 */
function MobileBackdrop() {
  const { open, isDesktop, close } = useSidebar();
  if (isDesktop || !open) return null;
  return (
    <div
      onClick={close}
      aria-hidden="true"
      className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
    />
  );
}

/**
 * TopBar
 * ---
 * Header fino com:
 *  - Botão hamburger (mobile) / colapsar (desktop) para o sidebar.
 *  - Toggle de tema claro/escuro.
 */
function TopBar() {
  const { theme, toggle } = useTheme();
  const { toggle: toggleSidebar, isDesktop, open } = useSidebar();

  return (
    <div className="sticky top-0 z-20 flex h-12 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--background)]/90 px-3 backdrop-blur sm:px-6">
      <button
        onClick={toggleSidebar}
        aria-label={
          isDesktop
            ? open
              ? "Colapsar menu"
              : "Expandir menu"
            : open
              ? "Fechar menu"
              : "Abrir menu"
        }
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      >
        {isDesktop ? (
          open ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          aria-label="Alternar tema"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
