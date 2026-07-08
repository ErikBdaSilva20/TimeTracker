import { useMediaQuery } from "@/hooks/use-media-query";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * SidebarContext
 * -----------------------------------------------------------------------------
 * Estado global do sidebar, com semânticas diferentes por viewport:
 *
 *  • DESKTOP (≥ lg): `open` = expandido vs. colapsado. Persistido no
 *    localStorage para lembrar a preferência entre sessões.
 *  • MOBILE  (< lg): `open` = drawer visível vs. escondido. Estado efêmero
 *    (não persiste — sempre começa fechado ao abrir a página).
 *
 * O consumidor não precisa saber a diferença: usa `open`, `toggle`, `close`.
 */

type SidebarContextValue = {
  open: boolean;
  isDesktop: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "timeflow:sidebar-desktop-open";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Preferência persistente: desktop expandido/colapsado.
  const [desktopOpen, setDesktopOpen] = usePersistentState<boolean>(STORAGE_KEY, true);
  // Estado efêmero do drawer mobile.
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const open = isDesktop ? desktopOpen : mobileOpen;
  const setOpen = useCallback(
    (v: boolean) => (isDesktop ? setDesktopOpen(v) : setMobileOpen(v)),
    [isDesktop, setDesktopOpen],
  );
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const value = useMemo(
    () => ({ open, setOpen, toggle, close, isDesktop }),
    [open, setOpen, toggle, close, isDesktop],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>");
  return ctx;
}
