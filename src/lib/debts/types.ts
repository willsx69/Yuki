/**
 * Modelo de domínio das dívidas parceladas (Etapa 3 — módulo Dívidas).
 *
 * Uma dívida é um contrato parcelado (financiamento, cartão parcelado,
 * empréstimo etc.) com um número FINITO de parcelas. As parcelas futuras
 * são materializadas como `Bill` (contas a pagar) vinculadas via `debtId`,
 * reaproveitando todo o fluxo existente de vencimento, baixa e transação.
 *
 * Valores em centavos (inteiros), iguais aos das transações.
 */

/** Status persistido da dívida. "settled" também é derivado quando não restam parcelas. */
export type DebtStatus = "active" | "settled" | "cancelled";

export type Debt = {
  id: string;
  /** Nome da dívida, ex.: "Notebook Nubank". */
  name: string;
  /** Credor ou instituição, ex.: "Nubank". */
  creditor: string;
  /** Valor total original contratado, quando conhecido (centavos). */
  totalOriginalCents: number | null;
  /** Valor de cada parcela (centavos). */
  installmentCents: number;
  /** Quantidade total de parcelas do contrato. */
  totalInstallments: number;
  /**
   * Parcelas já pagas ANTES do cadastro no Yuki (contrato em andamento).
   * Não geram bills nem transações — apenas alimentam o progresso.
   */
  initialPaidInstallments: number;
  /** Primeiro vencimento pendente ("YYYY-MM-DD"). */
  firstPendingDueDate: string;
  /** Periodicidade — mensal por enquanto. */
  periodicity: "monthly";
  /** Categoria usada nas parcelas geradas. */
  categoryId: string;
  /** Conta financeira usada nas parcelas geradas. */
  accountId: string;
  notes?: string;
  status: DebtStatus;
  /** Data ("YYYY-MM-DD") do encerramento (quitação antecipada ou cancelamento). */
  closedAt?: string | null;
  /** true quando quitada antes da última parcela (encerramento antecipado). */
  settledEarly?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** Payload de criação/edição de dívida. */
export type DebtDraft = {
  name: string;
  creditor: string;
  totalOriginalCents: number | null;
  installmentCents: number;
  totalInstallments: number;
  initialPaidInstallments: number;
  firstPendingDueDate: string;
  categoryId: string;
  accountId: string;
  notes?: string;
};
