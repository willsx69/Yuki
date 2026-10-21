"use client";

import { useBillsContext } from "@/components/providers/bills-provider";

/**
 * Acesso às contas a pagar/receber do usuário (fonte única de dados).
 * Deve ser usado apenas em componentes de cliente dentro da área do app
 * (dentro de <BillsProvider>).
 */
export function useBills() {
  return useBillsContext();
}
