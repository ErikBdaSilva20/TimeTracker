import { useEffect, useState } from "react";

/**
 * usePersistentState
 * -----------------------------------------------------------------------------
 * `useState` que persiste o valor em `localStorage`. Ideal para preferências
 * de UI (tema, colapso do sidebar, etc.) que devem sobreviver entre sessões.
 *
 * SSR-safe: no primeiro render usa `initialValue`, então hidrata a partir do
 * storage em um `useEffect` para evitar mismatch de hidratação.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  // Hidrata do localStorage no client — evita erro em SSR.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage indisponível: mantém initialValue */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Escreve no localStorage sempre que o valor mudar.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / private mode */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
