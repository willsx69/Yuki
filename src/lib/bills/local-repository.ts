import { isValidISODate } from "@/lib/transactions/finance";
import { addMonthsToDate, planInstallments } from "./finance";
import type { BillRepository } from "./repository";
import type { Bill, BillDraft, BillUpdateDraft } from "./types";

/**
 * CAMADA DE PERSISTÊNCIA PROVISÓRIA (Etapa 3).
 *
 * Salva as contas a pagar/receber no localStorage do navegador, identificado
 * pela chave `finora:bills:v1`. Diferente de um array apenas em memória, os
 * dados sobrevivem à navegação entre páginas e ao recarregamento.
 *
 * Quando o banco definitivo (PostgreSQL/Supabase) estiver disponível, esta
 * classe será substituída por outra que cumpra o mesmo contrato
 * (`BillRepository`), sem tocar na interface.
 */

const STORAGE_KEY = "finora:bills:v1";
const STORAGE_VERSION = 1 as const;

/** Limite para parcelas avulsas (compras parceladas). */
export const MAX_INSTALLMENTS = 24;
/** Limite para parcelas de dívidas de longo prazo (ex.: 120 meses). */
export const MAX_DEBT_INSTALLMENTS = 120;

type StoredPayload = {
  version: typeof STORAGE_VERSION;
  items: Bill[];
};

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bill-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function assertValidAmount(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("O valor da conta deve ser um número inteiro de centavos maior que zero.");
  }
}

function assertValidBase(draft: BillDraft): void {
  if (draft.type !== "payable" && draft.type !== "receivable") {
    throw new Error("Tipo de conta inválido.");
  }
  assertValidAmount(draft.amountCents);
  if (!draft.description.trim()) {
    throw new Error("A descrição da conta é obrigatória.");
  }
  if (!draft.categoryId.trim()) {
    throw new Error("A categoria da conta é obrigatória.");
  }
  if (!draft.accountId.trim()) {
    throw new Error("A conta financeira é obrigatória.");
  }
  if (!isValidISODate(draft.dueDate)) {
    throw new Error("O vencimento da conta é inválido.");
  }
  const max = draft.debtId ? MAX_DEBT_INSTALLMENTS : MAX_INSTALLMENTS;
  if (
    !Number.isInteger(draft.totalInstallments) ||
    draft.totalInstallments < 1 ||
    draft.totalInstallments > max
  ) {
    throw new Error(`O número de parcelas deve estar entre 1 e ${max}.`);
  }
  const start = draft.installmentStart ?? 1;
  const generate = draft.installmentsToGenerate ?? draft.totalInstallments;
  if (!Number.isInteger(start) || start < 1) {
    throw new Error("O número da primeira parcela é inválido.");
  }
  if (!Number.isInteger(generate) || generate < 1 || start + generate - 1 > draft.totalInstallments) {
    throw new Error("A quantidade de parcelas a gerar é inválida.");
  }
}

export class LocalStorageBillRepository implements BillRepository {
  read(): Bill[] {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Partial<StoredPayload>;
      if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) {
        return [];
      }

      return parsed.items.filter(
        (item): item is Bill =>
          Boolean(item) &&
          typeof item.id === "string" &&
          typeof item.description === "string" &&
          typeof item.amountCents === "number" &&
          typeof item.dueDate === "string" &&
          typeof item.categoryId === "string" &&
          (item.status === "pending" || item.status === "paid"),
      );
    } catch {
      return [];
    }
  }

  private write(items: Bill[]): Bill[] {
    const payload: StoredPayload = { version: STORAGE_VERSION, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return items;
  }

  async list(): Promise<Bill[]> {
    return this.read();
  }

  async createDraft(draft: BillDraft): Promise<Bill[]> {
    assertValidBase(draft);

    const start = draft.installmentStart ?? 1;
    const generate = draft.installmentsToGenerate ?? draft.totalInstallments;
    const groupId = draft.totalInstallments > 1 ? newId() : null;
    const timestamp = nowISO();

    // Dívidas: cada parcela tem o mesmo valor (amountCents = valor da parcela)
    // e vencimentos mensais consecutivos a partir da data informada.
    const plans =
      draft.perInstallmentAmount && draft.debtId
        ? Array.from({ length: generate }, (_, index) => ({
            installmentNumber: start + index,
            dueDate: addMonthsToDate(draft.dueDate, index),
            amountCents: draft.amountCents,
          }))
        : planInstallments(draft.amountCents, draft.totalInstallments, draft.dueDate).slice(
            start - 1,
            start - 1 + generate,
          );

    const created: Bill[] = plans.map((item) => ({
      id: newId(),
      type: draft.type,
      description: draft.description.trim(),
      amountCents: item.amountCents,
      categoryId: draft.categoryId,
      accountId: draft.accountId,
      dueDate: item.dueDate,
      status: "pending" as const,
      installmentNumber: item.installmentNumber,
      totalInstallments: draft.totalInstallments,
      billGroupId: groupId,
      debtId: draft.debtId ?? null,
      notes: draft.notes?.trim() || undefined,
      paidAt: null,
      linkedTransactionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    this.write([...created, ...this.read()]);
    return created;
  }

  async update(id: string, patch: BillUpdateDraft): Promise<Bill> {
    assertValidAmount(patch.amountCents);
    if (!patch.description.trim()) {
      throw new Error("A descrição da conta é obrigatória.");
    }
    if (!patch.categoryId.trim()) {
      throw new Error("A categoria da conta é obrigatória.");
    }
    if (!patch.accountId.trim()) {
      throw new Error("A conta financeira é obrigatória.");
    }
    if (!isValidISODate(patch.dueDate)) {
      throw new Error("O vencimento da conta é inválido.");
    }

    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Conta não encontrada.");
    }
    if (existing.status === "paid") {
      throw new Error("Contas quitadas não podem ser editadas. Desfaça a baixa antes de alterar.");
    }

    const updated: Bill = {
      ...existing,
      description: patch.description.trim(),
      amountCents: patch.amountCents,
      categoryId: patch.categoryId,
      accountId: patch.accountId,
      dueDate: patch.dueDate,
      notes: patch.notes?.trim() || undefined,
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async remove(id: string): Promise<void> {
    const items = this.read();
    this.write(items.filter((item) => item.id !== id));
  }

  async markPaid(id: string, paidAt: string, linkedTransactionId: string): Promise<Bill> {
    if (!isValidISODate(paidAt)) {
      throw new Error("A data da baixa é inválida.");
    }

    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Conta não encontrada.");
    }
    if (existing.status === "paid") {
      throw new Error("Esta conta já está quitada.");
    }

    const updated: Bill = {
      ...existing,
      status: "paid",
      paidAt,
      linkedTransactionId,
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async markUnpaid(id: string): Promise<Bill> {
    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Conta não encontrada.");
    }
    if (existing.status !== "paid") {
      throw new Error("Esta conta não está quitada.");
    }

    const updated: Bill = {
      ...existing,
      status: "pending",
      paidAt: null,
      linkedTransactionId: null,
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}
