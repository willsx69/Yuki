/**
 * Modelo de domínio das transações financeiras (Etapa 2).
 *
 * Os valores monetários são armazenados como inteiros em centavos para
 * evitar erros de ponto flutuante. A conversão para reais acontece apenas
 * na camada de exibição (src/lib/format.ts e src/lib/transactions/money.ts).
 *
 * Estes tipos e o contrato de persistência (repository.ts) foram desenhados
 * para facilitar a migração futura para PostgreSQL/Supabase sem alterar a UI.
 */

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  /** Valor sempre positivo, em centavos. O sinal é dado pelo `type`. */
  amountCents: number;
  description: string;
  categoryId: string;
  /** Data no formato "YYYY-MM-DD" (sem fuso horário). */
  date: string;
  accountId: string;
  paymentMethodId: string;
  notes?: string;
  /** ISO 8601 — preenchido pela camada de persistência. */
  createdAt?: string;
  updatedAt?: string;
};

/** Payload de criação/edição (sem campos gerados pela persistência). */
export type TransactionDraft = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

export type Category = {
  id: string;
  label: string;
  type: TransactionType;
  /** Marcadas como personalizadas serão persistidas junto às transações. */
  isCustom?: boolean;
};

export type Account = {
  id: string;
  label: string;
};

export type PaymentMethod = {
  id: string;
  label: string;
};
