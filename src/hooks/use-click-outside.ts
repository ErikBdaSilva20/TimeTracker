import { useEffect, type RefObject } from "react";

/**
 * useClickOutside
 * -----------------------------------------------------------------------------
 * Executa `handler` quando um clique (ou toque) ocorre fora do elemento
 * referenciado. Usado principalmente pelo drawer do sidebar no mobile para
 * fechar automaticamente ao clicar em qualquer área da página.
 *
 * @param ref     Referência ao elemento que deve permanecer "seguro".
 * @param handler Callback disparado no clique externo.
 * @param enabled Permite ligar/desligar o listener sem desmontar o componente
 *                (ex.: só ativa quando o drawer está aberto).
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      // Ignora cliques que aconteceram dentro do próprio elemento.
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}
