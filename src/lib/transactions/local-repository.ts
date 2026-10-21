import { isValidISODate } from "./finance";
import type { TransactionRepository } from "./repository";
import type { Transaction, TransactionDraft } from "./types";

/**
 * CAMADA DE PERSISTÊNCIA PROVISÓRIA (Etapa 2).
 *
 * Salva as transações no localStorage do navegador, identificado pela chave
 * `finora:transactions:v1`. Diferente de um array apenas em memória, os
 * dados sobrevivem à navegação entre páginas e ao recarregamento.
 *
 * Quando o banco definitivo (PostgreSQL/Supabase) estiver disponível, esta
 * classe será substituída por outra que cumpra o mesmo contrato
 * (`TransactionRepository`), sem tocar na interface.
 */

const STORAGE_KEY = "finora:transactions:v1";
const STORAGE_VERSION = 1 as const;

type StoredPayload = {
  version: typeof STORAGE_VERSION;
  items: Transaction[];
};

export function isLocalStorageAvailable(): boolean {
  try {
    const probe = "finora:storage-probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function assertValidDraft(draft: TransactionDraft): void {
  if (draft.type !== "income" && draft.type !== "expense") {
    throw new Error("Tipo de transação inválido.");
  }
  if (!Number.isInteger(draft.amountCents) || draft.amountCents <= 0) {
    throw new Error("O valor da transação deve ser um número inteiro de centavos maior que zero.");
  }
  if (!draft.description.trim()) {
    throw new Error("A descrição da transação é obrigatória.");
  }
  if (!draft.categoryId.trim()) {
    throw new Error("A categoria da transação é obrigatória.");
  }
  if (!isValidISODate(draft.date)) {
    throw new Error("A data da transação é inválida.");
  }
  if (!draft.accountId.trim()) {
    throw new Error("A conta financeira é obrigatória.");
  }
  if (!draft.paymentMethodId.trim()) {
    throw new Error("A forma de pagamento é obrigatória.");
  }
}

export class LocalStorageTransactionRepository implements TransactionRepository {
  read(): Transaction[] {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Partial<StoredPayload>;
      if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) {
        return [];
      }

      return parsed.items.filter(
        (item): item is Transaction =>
          Boolean(item) &&
          typeof item.id === "string" &&
          typeof item.description === "string" &&
          typeof item.amountCents === "number" &&
          typeof item.date === "string" &&
          typeof item.categoryId === "string",
      );
    } catch {
      return [];
    }
  }

  private write(items: Transaction[]): Transaction[] {
    const payload: StoredPayload = { version: STORAGE_VERSION, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return items;
  }

  async list(): Promise<Transaction[]> {
    return this.read();
  }

  async create(draft: TransactionDraft): Promise<Transaction> {
    assertValidDraft(draft);

    const transaction: Transaction = {
      ...draft,
      description: draft.description.trim(),
      notes: draft.notes?.trim() || undefined,
      id: newId(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    this.write([transaction, ...this.read()]);
    return transaction;
  }

  async update(id: string, draft: TransactionDraft): Promise<Transaction> {
    assertValidDraft(draft);

    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Transação não encontrada.");
    }

    const updated: Transaction = {
      ...existing,
      ...draft,
      description: draft.description.trim(),
      notes: draft.notes?.trim() || undefined,
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async remove(id: string): Promise<void> {
    const items = this.read();
    this.write(items.filter((item) => item.id !== id));
  }
}
