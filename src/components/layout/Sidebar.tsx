import { useClickOutside } from "@/hooks/use-click-outside";
import { useAuth } from "@/lib/auth";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Timer, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NAV_GROUPS } from "./nav-items";
import { useSidebar } from "./sidebar-context";

/**
 * Sidebar
 * -----------------------------------------------------------------------------
 * Barra lateral de navegação com dois modos:
 *
 *  • DESKTOP (≥ lg): sempre visível; alterna entre expandido (largura total,
 *    com labels + agrupamentos) e colapsado (apenas ícones, largura fixa).
 *
 *  • MOBILE  (< lg): renderizada como drawer sobreposto. O backdrop é
 *    desenhado pelo `AppLayout`; aqui apenas escutamos click-outside e Esc
 *    para fechar automaticamente.
 *
 * A navegação (`Link` do TanStack Router) fecha o drawer no mobile ao mudar
 * de rota, evitando que o usuário precise fechar manualmente.
 */
export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const { open, isDesktop, close } = useSidebar();
  const asideRef = useRef<HTMLElement>(null);

  // No desktop, `open` significa expandido vs. colapsado (icon-only).
  const collapsed = isDesktop && !open;
  // No mobile, drawer só aparece quando aberto.
  const mobileHidden = !isDesktop && !open;

  // ─── Auto-close: fecha o drawer ao navegar no mobile ─────────────────────
  useEffect(() => {
    if (!isDesktop && open) close();
    // Só reagimos à mudança de rota — não incluir `open` para evitar loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ─── Click-outside: só no mobile e só quando aberto ──────────────────────
  useClickOutside(asideRef, close, !isDesktop && open);

  // ─── Esc key para fechar o drawer no mobile ──────────────────────────────
  useEffect(() => {
    if (isDesktop || !open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDesktop, open, close]);

  return (
    <aside
      ref={asideRef}
      aria-label="Navegação principal"
      className={[
        "z-40 flex shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background-secondary)]",
        "transition-[width,transform] duration-200 ease-out",
        // Desktop: largura muda conforme colapsado.
        isDesktop ? (collapsed ? "w-16" : "w-[248px]") : "w-[280px]",
        // Mobile: drawer fixo, animação de translate.
        isDesktop
          ? "sticky top-0 h-screen"
          : `fixed inset-y-0 left-0 h-screen ${mobileHidden ? "-translate-x-full" : "translate-x-0"}`,
      ].join(" ")}
    >
      {/* ─── Branding ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Timer className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">TimeFlow</div>
            <div className="truncate text-[11px] text-[var(--text-muted)]">
              Work · Time · Billing
            </div>
          </div>
        )}
        {/* Botão de fechar visível apenas no drawer mobile. */}
        {!isDesktop && (
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ─── Navegação ────────────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((g) => (
          <div key={g.label}>
            {!collapsed && (
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {g.label}
              </div>
            )}
            <div className="space-y-1">
              {g.items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(it.to + "/");
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    title={collapsed ? it.label : undefined}
                    className={[
                      "sidebar-item text-sm",
                      active && "sidebar-item-active",
                      collapsed && "justify-center px-2",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <it.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Rodapé: usuário logado + logout ──────────────────────────────── */}
      <div className="border-t border-[var(--border)] p-3">
        <div
          className={`flex items-center gap-3 rounded-xl bg-[var(--surface)] p-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-hover)] text-sm font-semibold">
            {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user?.name || "Usuário"}</div>
                <div className="truncate text-xs text-[var(--text-muted)]">{user?.email}</div>
              </div>
              <button
                onClick={() => void signOut()}
                title="Sair"
                aria-label="Sair"
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
