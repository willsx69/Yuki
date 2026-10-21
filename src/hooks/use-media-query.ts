"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Media query reativa (mobile-first). Retorna `false` no servidor e no
 * primeiro render, evitando divergência de hidratação.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Telas de celular (< 640px): gráficos e layouts mais compactos. */
export function useIsNarrowScreen(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
