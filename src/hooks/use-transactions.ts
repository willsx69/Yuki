"use client";

import { useTransactionsContext } from "@/components/providers/transactions-provider";
import { defaultCategories } from "@/lib/transactions/categories";
import type { Category } from "@/lib/transactions/types";

/**
 * Acesso às transações do usuário (fonte única de dados).
 * Deve ser usado apenas em componentes de cliente dentro da área do app.
 */
export function useTransactions() {
  return useTransactionsContext();
}

/** Categorias padrão + personalizadas (futuro). */
export function useTransactionCategories(extra: Category[] = []): Category[] {
  const { customCategories } = useTransactionsContext();
  return [...defaultCategories, ...customCategories, ...extra];
}
