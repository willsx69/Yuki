import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { repositoryError } from "@/lib/supabase/errors";
import type { Bill } from "@/lib/bills/types";
import type { Debt } from "@/lib/debts/types";
import type { Transaction } from "@/lib/transactions/types";

/**
 * Migração EXPLÍCITA dos dados locais (Etapa 2) para a conta autenticada.
 *
 * - O usuário aciona o botão em Configurações; nada é migrado sozinho;
 * - As linhas antigas ganham o `user_id` do usuário logado (preenchido no
 *   banco via trigger, nunca enviado pelo cliente);
 * - Vínculos internos (parcela ↔ dívida, baixa ↔ transação) são
 *   remapeados para os novos IDs gerados no Supabase.
 *
 * Os dados locais NÃO são apagados após a importação — o usuário pode
 * removê-los manualmente nas ferramentas do navegador.
 */

const LOCAL_KEYS = {
  transactions: "finora:transactions:v1",
  bills: "finora:bills:v1",
  debts: "finora:debts:v1",
} as const;

export type ImportSummary = {
  transactions: number;
  bills: number;
  debts: number;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readLocalItems<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: number; items?: unknown };
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items as T[];
  } catch {
    return [];
  }
}

/** Há algo no localStorage para importar? */
export function hasLocalDataToImport(): boolean {
  return (
    readLocalItems(LOCAL_KEYS.transactions).length > 0 ||
    readLocalItems(LOCAL_KEYS.bills).length > 0 ||
    readLocalItems(LOCAL_KEYS.debts).length > 0
  );
}

export async function importLocalData(): Promise<ImportSummary> {
  const supabase = createSupabaseBrowserClient();

  const localTransactions = readLocalItems<Transaction>(LOCAL_KEYS.transactions).filter(
    (item) => item && typeof item.amountCents === "number" && item.amountCents > 0 && item.categoryId,
  );
  const localBills = readLocalItems<Bill>(LOCAL_KEYS.bills).filter(
    (item) => item && typeof item.amountCents === "number" && item.amountCents > 0 && item.categoryId,
  );
  const localDebts = readLocalItems<Debt>(LOCAL_KEYS.debts).filter(
    (item) => item && typeof item.installmentCents === "number" && item.installmentCents > 0,
  );

  const summary: ImportSummary = { transactions: 0, bills: 0, debts: 0 };
  const transactionIdMap = new Map<string, string>();
  const debtIdMap = new Map<string, string>();

  // 1) Transações primeiro (as baixas de bills referenciam esses IDs).
  if (localTransactions.length > 0) {
    const rows = localTransactions.map((item) => ({
      type: item.type,
      amount_cents: item.amountCents,
      description: item.description,
      category_id: item.categoryId,
      date: item.date,
      account_id: item.accountId,
      payment_method_id: item.paymentMethodId,
      notes: item.notes ?? null,
    }));

    const { data, error } = await supabase
      .from("transactions")
      .insert(rows)
      .select("id");

    if (error) {
      throw repositoryError("Não foi possível importar as transações.", error);
    }

    (data ?? []).forEach((row: { id: string }, index: number) => {
      const original = localTransactions[index];
      if (original?.id) transactionIdMap.set(original.id, row.id);
    });
    summary.transactions = data?.length ?? 0;
  }

  // 2) Dívidas (as parcelas referenciam esses IDs).
  if (localDebts.length > 0) {
    const rows = localDebts.map((item) => ({
      name: item.name,
      creditor: item.creditor,
      total_original_cents: item.totalOriginalCents,
      installment_cents: item.installmentCents,
      total_installments: item.totalInstallments,
      initial_paid_installments: item.initialPaidInstallments,
      first_pending_due_date: item.firstPendingDueDate,
      periodicity: "monthly",
      category_id: item.categoryId,
      account_id: item.accountId,
      notes: item.notes ?? null,
      status: item.status,
      closed_at: item.closedAt ?? null,
      settled_early: Boolean(item.settledEarly),
    }));

    const { data, error } = await supabase.from("debts").insert(rows).select("id");

    if (error) {
      throw repositoryError("Não foi possível importar as dívidas.", error);
    }

    (data ?? []).forEach((row: { id: string }, index: number) => {
      const original = localDebts[index];
      if (original?.id) debtIdMap.set(original.id, row.id);
    });
    summary.debts = data?.length ?? 0;
  }

  // 3) Contas/parcelas, com vínculos remapeados.
  if (localBills.length > 0) {
    const rows = localBills.map((item) => ({
      type: item.type,
      description: item.description,
      amount_cents: item.amountCents,
      category_id: item.categoryId,
      account_id: item.accountId,
      due_date: item.dueDate,
      status: item.status,
      installment_number: item.installmentNumber ?? 1,
      total_installments: item.totalInstallments ?? 1,
      bill_group_id:
        item.billGroupId && UUID_REGEX.test(item.billGroupId) ? item.billGroupId : null,
      debt_id: item.debtId ? (debtIdMap.get(item.debtId) ?? null) : null,
      notes: item.notes ?? null,
      paid_at: item.paidAt ?? null,
      linked_transaction_id: item.linkedTransactionId
        ? (transactionIdMap.get(item.linkedTransactionId) ?? null)
        : null,
    }));

    const { data, error } = await supabase.from("bills").insert(rows).select("id");

    if (error) {
      throw repositoryError("Não foi possível importar as contas.", error);
    }

    summary.bills = data?.length ?? 0;
  }

  return summary;
}
