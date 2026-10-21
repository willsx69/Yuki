import { isValidISODate } from "@/lib/transactions/finance";
import { MAX_DEBT_INSTALLMENTS } from "@/lib/bills/local-repository";
import type { DebtRepository } from "./repository";
import type { Debt, DebtDraft } from "./types";

/**
 * CAMADA DE PERSISTÊNCIA PROVISÓRIA (Etapa 3 — dívidas).
 *
 * Salva as dívidas no localStorage do navegador, identificado pela chave
 * `finora:debts:v1`. As parcelas NÃO são salvas aqui: elas são `Bill`s
 * (chave `finora:bills:v1`) vinculadas por `debtId` — fonte única das
 * parcelas, evitando duplicação de estado.
 */

const STORAGE_KEY = "finora:debts:v1";
const STORAGE_VERSION = 1 as const;

type StoredPayload = {
  version: typeof STORAGE_VERSION;
  items: Debt[];
};

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `debt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function assertValidDebtDraft(draft: DebtDraft): void {
  if (!draft.name.trim()) {
    throw new Error("O nome da dívida é obrigatório.");
  }
  if (!draft.creditor.trim()) {
    throw new Error("O credor ou instituição é obrigatório.");
  }
  if (!Number.isInteger(draft.installmentCents) || draft.installmentCents <= 0) {
    throw new Error("O valor da parcela deve ser um número inteiro de centavos maior que zero.");
  }
  if (
    !Number.isInteger(draft.totalInstallments) ||
    draft.totalInstallments < 1 ||
    draft.totalInstallments > MAX_DEBT_INSTALLMENTS
  ) {
    throw new Error(`O total de parcelas deve estar entre 1 e ${MAX_DEBT_INSTALLMENTS}.`);
  }
  if (
    !Number.isInteger(draft.initialPaidInstallments) ||
    draft.initialPaidInstallments < 0 ||
    draft.initialPaidInstallments >= draft.totalInstallments
  ) {
    throw new Error(
      "As parcelas já pagas devem ser um número menor que o total (deixe ao menos uma pendente).",
    );
  }
  if (!isValidISODate(draft.firstPendingDueDate)) {
    throw new Error("O primeiro vencimento pendente é inválido.");
  }
  if (!draft.categoryId.trim()) {
    throw new Error("A categoria da dívida é obrigatória.");
  }
  if (!draft.accountId.trim()) {
    throw new Error("A conta financeira é obrigatória.");
  }
  if (
    draft.totalOriginalCents !== null &&
    (!Number.isInteger(draft.totalOriginalCents) || draft.totalOriginalCents <= 0)
  ) {
    throw new Error("O valor total original, quando informado, deve ser maior que zero.");
  }
}

export class LocalStorageDebtRepository implements DebtRepository {
  read(): Debt[] {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Partial<StoredPayload>;
      if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) {
        return [];
      }

      return parsed.items.filter(
        (item): item is Debt =>
          Boolean(item) &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.creditor === "string" &&
          typeof item.installmentCents === "number" &&
          typeof item.totalInstallments === "number" &&
          typeof item.firstPendingDueDate === "string",
      );
    } catch {
      return [];
    }
  }

  private write(items: Debt[]): Debt[] {
    const payload: StoredPayload = { version: STORAGE_VERSION, items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return items;
  }

  async list(): Promise<Debt[]> {
    return this.read();
  }

  async create(draft: DebtDraft): Promise<Debt> {
    assertValidDebtDraft(draft);

    const timestamp = nowISO();
    const debt: Debt = {
      id: newId(),
      name: draft.name.trim(),
      creditor: draft.creditor.trim(),
      totalOriginalCents: draft.totalOriginalCents,
      installmentCents: draft.installmentCents,
      totalInstallments: draft.totalInstallments,
      initialPaidInstallments: draft.initialPaidInstallments,
      firstPendingDueDate: draft.firstPendingDueDate,
      periodicity: "monthly",
      categoryId: draft.categoryId,
      accountId: draft.accountId,
      notes: draft.notes?.trim() || undefined,
      status: "active",
      closedAt: null,
      settledEarly: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.write([debt, ...this.read()]);
    return debt;
  }

  async update(id: string, patch: DebtDraft): Promise<Debt> {
    assertValidDebtDraft(patch);

    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Dívida não encontrada.");
    }
    if (existing.status !== "active") {
      throw new Error("Apenas dívidas ativas podem ser editadas.");
    }

    const updated: Debt = {
      ...existing,
      name: patch.name.trim(),
      creditor: patch.creditor.trim(),
      totalOriginalCents: patch.totalOriginalCents,
      installmentCents: patch.installmentCents,
      totalInstallments: patch.totalInstallments,
      initialPaidInstallments: patch.initialPaidInstallments,
      firstPendingDueDate: patch.firstPendingDueDate,
      categoryId: patch.categoryId,
      accountId: patch.accountId,
      notes: patch.notes?.trim() || undefined,
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async settleEarly(id: string): Promise<Debt> {
    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Dívida não encontrada.");
    }
    if (existing.status !== "active") {
      throw new Error("Esta dívida já foi encerrada.");
    }

    const updated: Debt = {
      ...existing,
      status: "settled",
      settledEarly: true,
      closedAt: new Date().toISOString().slice(0, 10),
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async cancel(id: string): Promise<Debt> {
    const items = this.read();
    const existing = items.find((item) => item.id === id);
    if (!existing) {
      throw new Error("Dívida não encontrada.");
    }
    if (existing.status === "cancelled") {
      throw new Error("Esta dívida já está cancelada.");
    }

    const updated: Debt = {
      ...existing,
      status: "cancelled",
      closedAt: new Date().toISOString().slice(0, 10),
      updatedAt: nowISO(),
    };

    this.write(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}
