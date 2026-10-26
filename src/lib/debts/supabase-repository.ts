import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { repositoryError } from "@/lib/supabase/errors";
import { assertValidDebtDraft } from "./local-repository";
import type { DebtRepository } from "./repository";
import type { Debt, DebtDraft } from "./types";

/**
 * Repositório de dívidas no Supabase (ETAPA 3).
 *
 * Guarda apenas o contrato; as parcelas pendentes continuam sendo linhas de
 * `bills` com `debt_id` (fonte única), orquestradas pelo DebtsProvider.
 * `user_id` vem do banco (trigger + auth.uid()) e RLS isola cada usuário.
 */

const SELECT_COLUMNS =
  "id, name, creditor, total_original_cents, installment_cents, total_installments, initial_paid_installments, first_pending_due_date, periodicity, category_id, account_id, notes, status, closed_at, settled_early, created_at, updated_at";

type DebtRow = {
  id: string;
  name: string;
  creditor: string;
  total_original_cents: number | null;
  installment_cents: number;
  total_installments: number;
  initial_paid_installments: number;
  first_pending_due_date: string;
  periodicity: string;
  category_id: string;
  account_id: string;
  notes: string | null;
  status: "active" | "settled" | "cancelled";
  closed_at: string | null;
  settled_early: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DebtRow): Debt {
  return {
    id: row.id,
    name: row.name,
    creditor: row.creditor,
    totalOriginalCents: row.total_original_cents,
    installmentCents: row.installment_cents,
    totalInstallments: row.total_installments,
    initialPaidInstallments: row.initial_paid_installments,
    firstPendingDueDate: row.first_pending_due_date,
    periodicity: "monthly",
    categoryId: row.category_id,
    accountId: row.account_id,
    notes: row.notes ?? undefined,
    status: row.status,
    closedAt: row.closed_at,
    settledEarly: row.settled_early,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsertValues(draft: DebtDraft) {
  return {
    name: draft.name.trim(),
    creditor: draft.creditor.trim(),
    total_original_cents: draft.totalOriginalCents,
    installment_cents: draft.installmentCents,
    total_installments: draft.totalInstallments,
    initial_paid_installments: draft.initialPaidInstallments,
    first_pending_due_date: draft.firstPendingDueDate,
    periodicity: "monthly" as const,
    category_id: draft.categoryId,
    account_id: draft.accountId,
    notes: draft.notes?.trim() || null,
  };
}

export class SupabaseDebtRepository implements DebtRepository {
  private client() {
    return createSupabaseBrowserClient();
  }

  async list(): Promise<Debt[]> {
    const { data, error } = await this.client()
      .from("debts")
      .select(SELECT_COLUMNS)
      .order("first_pending_due_date", { ascending: false });

    if (error) {
      throw repositoryError("Não foi possível carregar as dívidas.", error);
    }

    return ((data ?? []) as DebtRow[]).map(mapRow);
  }

  async create(draft: DebtDraft): Promise<Debt> {
    assertValidDebtDraft(draft);

    const { data, error } = await this.client()
      .from("debts")
      .insert(toInsertValues(draft))
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      throw repositoryError("Não foi possível criar a dívida.", error);
    }

    return mapRow(data as DebtRow);
  }

  async update(id: string, patch: DebtDraft): Promise<Debt> {
    assertValidDebtDraft(patch);

    const { data, error } = await this.client()
      .from("debts")
      .update(toInsertValues(patch))
      .eq("id", id)
      .eq("status", "active")
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível atualizar a dívida.", error);
    }
    if (!data) {
      const existing = await this.findById(id);
      if (existing && existing.status !== "active") {
        throw new Error("Apenas dívidas ativas podem ser editadas.");
      }
      throw new Error("Dívida não encontrada.");
    }

    return mapRow(data as DebtRow);
  }

  async settleEarly(id: string): Promise<Debt> {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await this.client()
      .from("debts")
      .update({
        status: "settled",
        settled_early: true,
        closed_at: today,
      })
      .eq("id", id)
      .eq("status", "active")
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível encerrar a dívida.", error);
    }
    if (!data) {
      throw new Error("Esta dívida já foi encerrada.");
    }

    return mapRow(data as DebtRow);
  }

  async cancel(id: string): Promise<Debt> {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await this.client()
      .from("debts")
      .update({
        status: "cancelled",
        closed_at: today,
      })
      .eq("id", id)
      .neq("status", "cancelled")
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível cancelar a dívida.", error);
    }
    if (!data) {
      throw new Error("Esta dívida já está cancelada.");
    }

    return mapRow(data as DebtRow);
  }

  private async findById(id: string): Promise<Debt | null> {
    const { data } = await this.client()
      .from("debts")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    return data ? mapRow(data as DebtRow) : null;
  }
}
