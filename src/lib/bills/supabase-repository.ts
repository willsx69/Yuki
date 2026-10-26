import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { repositoryError } from "@/lib/supabase/errors";
import { buildInstallmentPlan } from "./finance";
import { assertValidBillDraft } from "./local-repository";
import type { BillRepository } from "./repository";
import type { Bill, BillDraft, BillUpdateDraft } from "./types";

/**
 * Repositório de contas a pagar/receber no Supabase (ETAPA 3).
 *
 * Mesmo contrato de `repository.ts` — a UI não muda. `user_id` é preenchido
 * no banco (trigger + auth.uid()); RLS isola cada usuário.
 */

const SELECT_COLUMNS =
  "id, type, description, amount_cents, category_id, account_id, due_date, status, installment_number, total_installments, bill_group_id, debt_id, notes, paid_at, linked_transaction_id, created_at, updated_at";

type BillRow = {
  id: string;
  type: "payable" | "receivable";
  description: string;
  amount_cents: number;
  category_id: string;
  account_id: string;
  due_date: string;
  status: "pending" | "paid";
  installment_number: number;
  total_installments: number;
  bill_group_id: string | null;
  debt_id: string | null;
  notes: string | null;
  paid_at: string | null;
  linked_transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: BillRow): Bill {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amountCents: row.amount_cents,
    categoryId: row.category_id,
    accountId: row.account_id,
    dueDate: row.due_date,
    status: row.status,
    installmentNumber: row.installment_number,
    totalInstallments: row.total_installments,
    billGroupId: row.bill_group_id,
    debtId: row.debt_id,
    notes: row.notes ?? undefined,
    paidAt: row.paid_at,
    linkedTransactionId: row.linked_transaction_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newGroupId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bill-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class SupabaseBillRepository implements BillRepository {
  private client() {
    return createSupabaseBrowserClient();
  }

  async list(): Promise<Bill[]> {
    const { data, error } = await this.client()
      .from("bills")
      .select(SELECT_COLUMNS)
      .order("due_date", { ascending: false })
      .order("installment_number", { ascending: false });

    if (error) {
      throw repositoryError("Não foi possível carregar as contas.", error);
    }

    return ((data ?? []) as BillRow[]).map(mapRow);
  }

  async createDraft(draft: BillDraft): Promise<Bill[]> {
    assertValidBillDraft(draft);

    const plans = buildInstallmentPlan(draft);
    const groupId = draft.totalInstallments > 1 ? newGroupId() : null;

    const rows = plans.map((plan) => ({
      type: draft.type,
      description: draft.description.trim(),
      amount_cents: plan.amountCents,
      category_id: draft.categoryId,
      account_id: draft.accountId,
      due_date: plan.dueDate,
      status: "pending" as const,
      installment_number: plan.installmentNumber,
      total_installments: draft.totalInstallments,
      bill_group_id: groupId,
      debt_id: draft.debtId ?? null,
      notes: draft.notes?.trim() || null,
      paid_at: null,
      linked_transaction_id: null,
    }));

    const { data, error } = await this.client()
      .from("bills")
      .insert(rows)
      .select(SELECT_COLUMNS);

    if (error || !data) {
      throw repositoryError("Não foi possível criar as contas.", error);
    }

    return (data as BillRow[]).map(mapRow);
  }

  async update(id: string, patch: BillUpdateDraft): Promise<Bill> {
    if (!patch.description.trim()) {
      throw new Error("A descrição da conta é obrigatória.");
    }
    if (!patch.categoryId.trim()) {
      throw new Error("A categoria da conta é obrigatória.");
    }
    if (!patch.accountId.trim()) {
      throw new Error("A conta financeira é obrigatória.");
    }
    if (!Number.isInteger(patch.amountCents) || patch.amountCents <= 0) {
      throw new Error("O valor da conta deve ser um número inteiro de centavos maior que zero.");
    }

    const { data, error } = await this.client()
      .from("bills")
      .update({
        description: patch.description.trim(),
        amount_cents: patch.amountCents,
        category_id: patch.categoryId,
        account_id: patch.accountId,
        due_date: patch.dueDate,
        notes: patch.notes?.trim() || null,
      })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível atualizar a conta.", error);
    }
    if (!data) {
      const existing = await this.findById(id);
      if (existing?.status === "paid") {
        throw new Error(
          "Contas quitadas não podem ser editadas. Desfaça a baixa antes de alterar.",
        );
      }
      throw new Error("Conta não encontrada.");
    }

    return mapRow(data as BillRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client().from("bills").delete().eq("id", id);

    if (error) {
      throw repositoryError("Não foi possível excluir a conta.", error);
    }
  }

  async markPaid(id: string, paidAt: string, linkedTransactionId: string): Promise<Bill> {
    // Filtro por status pendente deixa a baixa idempotente no banco.
    const { data, error } = await this.client()
      .from("bills")
      .update({
        status: "paid",
        paid_at: paidAt,
        linked_transaction_id: linkedTransactionId,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível registrar a baixa.", error);
    }
    if (!data) {
      const existing = await this.findById(id);
      if (existing?.status === "paid") {
        throw new Error("Esta conta já está quitada.");
      }
      throw new Error("Conta não encontrada.");
    }

    return mapRow(data as BillRow);
  }

  async markUnpaid(id: string): Promise<Bill> {
    const { data, error } = await this.client()
      .from("bills")
      .update({
        status: "pending",
        paid_at: null,
        linked_transaction_id: null,
      })
      .eq("id", id)
      .eq("status", "paid")
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível desfazer a baixa.", error);
    }
    if (!data) {
      throw new Error("Esta conta não está quitada.");
    }

    return mapRow(data as BillRow);
  }

  private async findById(id: string): Promise<Bill | null> {
    const { data } = await this.client()
      .from("bills")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    return data ? mapRow(data as BillRow) : null;
  }
}
