import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { repositoryError } from "@/lib/supabase/errors";
import { assertValidDraft } from "./local-repository";
import type { TransactionRepository } from "./repository";
import type { Transaction, TransactionDraft } from "./types";

/**
 * Repositório de transações no Supabase (ETAPA 3 — multiusuário).
 *
 * Cumpr o contrato de `repository.ts`; a UI não muda. O `user_id` NÃO é
 * enviado pelo cliente: o banco preenche com `auth.uid()` (trigger) e as
 * políticas RLS garantem que cada pessoa só lê/escreve as próprias linhas.
 */

const SELECT_COLUMNS =
  "id, type, amount_cents, description, category_id, date, account_id, payment_method_id, notes, created_at, updated_at";

type TransactionRow = {
  id: string;
  type: "income" | "expense";
  amount_cents: number;
  description: string;
  category_id: string;
  date: string;
  account_id: string;
  payment_method_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amountCents: row.amount_cents,
    description: row.description,
    categoryId: row.category_id,
    date: row.date,
    accountId: row.account_id,
    paymentMethodId: row.payment_method_id,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsertValues(draft: TransactionDraft) {
  return {
    type: draft.type,
    amount_cents: draft.amountCents,
    description: draft.description.trim(),
    category_id: draft.categoryId,
    date: draft.date,
    account_id: draft.accountId,
    payment_method_id: draft.paymentMethodId,
    notes: draft.notes?.trim() || null,
  };
}

export class SupabaseTransactionRepository implements TransactionRepository {
  private client() {
    return createSupabaseBrowserClient();
  }

  async list(): Promise<Transaction[]> {
    const { data, error } = await this.client()
      .from("transactions")
      .select(SELECT_COLUMNS)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw repositoryError("Não foi possível carregar as transações.", error);
    }

    return ((data ?? []) as TransactionRow[]).map(mapRow);
  }

  async create(draft: TransactionDraft): Promise<Transaction> {
    assertValidDraft(draft);

    const { data, error } = await this.client()
      .from("transactions")
      .insert(toInsertValues(draft))
      .select(SELECT_COLUMNS)
      .single();

    if (error || !data) {
      throw repositoryError("Não foi possível criar a transação.", error);
    }

    return mapRow(data as TransactionRow);
  }

  async update(id: string, draft: TransactionDraft): Promise<Transaction> {
    assertValidDraft(draft);

    const { data, error } = await this.client()
      .from("transactions")
      .update(toInsertValues(draft))
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      throw repositoryError("Não foi possível atualizar a transação.", error);
    }
    if (!data) {
      throw new Error("Transação não encontrada.");
    }

    return mapRow(data as TransactionRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client().from("transactions").delete().eq("id", id);

    if (error) {
      throw repositoryError("Não foi possível excluir a transação.", error);
    }
  }
}
