/**
 * Modelo de domínio das contas a pagar/receber (Etapa 3).
 *
 * Uma conta é um compromisso financeiro com vencimento (boleto, conta fixa,
 * salário previsto etc.). Ao ser marcada como paga/recebida, a baixa gera um
 * lançamento real em `transactions`, mantendo o dashboard e a página de
 * Transações como fonte única do dinheiro efetivamente movimentado.
 *
 * Valores em centavos (inteiros), iguais aos das transações.
 */

export type BillType = "payable" | "receivable";

/**
 * Status persistido: "pending" ou "paid".
 * O estado "overdue" (vencida) é derivado do vencimento — nunca é salvo.
 */
export type BillStatus = "pending" | "paid";

export type Bill = {
  id: string;
  type: BillType;
  description: string;
  /** Valor sempre positivo, em centavos. */
  amountCents: number;
  categoryId: string;
  /** Conta em que a baixa será lançada. */
  accountId: string;
  /** Vencimento no formato "YYYY-MM-DD" (sem fuso horário). */
  dueDate: string;
  status: BillStatus;
  /** Parcela atual (1-based); 1 = à vista. */
  installmentNumber: number;
  /** Total de parcelas; 1 = à vista. */
  totalInstallments: number;
  /** Agrupa as parcelas criadas de uma mesma compra/contrato. */
  billGroupId: string | null;
  /** Vínculo com uma dívida (módulo de dívidas); null para contas avulsas. */
  debtId?: string | null;
  notes?: string;
  /** Data ("YYYY-MM-DD") em que a baixa foi registrada. */
  paidAt?: string | null;
  /** Lançamento criado na baixa (para desfazer a baixa). */
  linkedTransactionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Payload de criação (um ou vários lançamentos parcelados). */
export type BillDraft = {
  type: BillType;
  description: string;
  amountCents: number;
  categoryId: string;
  accountId: string;
  dueDate: string;
  /** 1–24 (contas avulsas) ou até 120 (parcelas de dívidas). */
  totalInstallments: number;
  /** Quantidade de parcelas a gerar (padrão: totalInstallments). */
  installmentsToGenerate?: number;
  /** Número da primeira parcela gerada (padrão: 1). */
  installmentStart?: number;
  /**
   * Quando true, `amountCents` é o valor de CADA parcela (dívidas);
   * quando false/ausente, é o valor TOTAL dividido entre as parcelas.
   */
  perInstallmentAmount?: boolean;
  /** Vincula as parcelas geradas a uma dívida. */
  debtId?: string | null;
  notes?: string;
};

/** Payload de edição de uma conta existente (apenas pendentes). */
export type BillUpdateDraft = {
  description: string;
  amountCents: number;
  categoryId: string;
  accountId: string;
  dueDate: string;
  notes?: string;
};
