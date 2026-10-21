"use client";

import { useDebtsContext } from "@/components/providers/debts-provider";

/**
 * Acesso às dívidas do usuário (fonte única de dados).
 * Deve ser usado apenas em componentes de cliente dentro de <DebtsProvider>.
 */
export function useDebts() {
  return useDebtsContext();
}
