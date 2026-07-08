import { useEffect, useState } from "react";

/**
 * useMediaQuery
 * -----------------------------------------------------------------------------
 * Retorna `true` quando a media query CSS informada casa com o viewport atual.
 * Reage a redimensionamento e orientação sem re-render manual.
 *
 * Ex.: `useMediaQuery("(min-width: 1024px)")` → true em telas ≥ lg.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
