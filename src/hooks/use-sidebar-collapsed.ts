"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "finora:sidebar-collapsed";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

/**
 * Estado do menu lateral, sincronizado com o localStorage.
 * Usa useSyncExternalStore para evitar divergência no primeiro render
 * (SSR sempre parte do menu expandido).
 */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Armazenamento indisponível (ex.: modo privado): mantém apenas o estado em memória.
    }
    emit();
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!getSnapshot());
  }, [setCollapsed]);

  return { collapsed, setCollapsed, toggleCollapsed };
}

/** Indica que o componente já foi hidratado no navegador. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
