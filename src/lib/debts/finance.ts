import { addMonthsToDate, effectiveBillStatus } from "@/lib/bills/finance";
import type { Bill } from "@/lib/bills/types";
import type { Debt, DebtStatus } from "./types";

/**
 * Regras de cálculo do módulo de dívidas (Etapa 3).
 * Funções puras, trabalhando em centavos (inteiros). O progresso de uma
 * dívida é derivado das parcelas (`Bill` com `debtId`) — nunca duplicado.
 */

/** Parcelas vinculadas a uma dívida, do mais antigo ao mais novo. */
export function billsForDebt(bills: Bill[], debtId: string): Bill[] {
  return bills
    .filter((bill) => bill.debtId === debtId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export type DebtProgress = {
  /** Parcelas pagas antes do cadastro + pagas no app. */
  paidCount: number;
  /** Parcelas pagas antes do cadastro (histórico importado). */
  initialPaidCount: number;
  /** Parcelas quitadas no app (com transação vinculada). */
  paidInAppCount: number;
  /** Parcelas ainda em aberto (pendentes ou vencidas). */
  pendingCount: number;
  /** Parcelas vencidas (não pagas com vencimento no passado). */
  overdueCount: number;
  /** Valor já quitado: estimativa das iniciais + soma das pagas no app. */
  paidCents: number;
  /** Saldo devedor estimado: soma das parcelas em aberto. */
  remainingCents: number;
  /** Progresso 0–100 (parcelas pagas / total). */
  progressPercent: number;
  /** Próximo vencimento em aberto, se houver. */
  nextDueDate: string | null;
  /** Data prevista de quitação (último vencimento em aberto; pagas se quitada). */
  payoffDate: string | null;
  /** Status derivado: cancelada, quitada (sem parcelas em aberto) ou ativa. */
  status: DebtStatus;
};

export function effectiveDebtStatus(debt: Debt, bills: Bill[], today: string): DebtStatus {
  if (debt.status === "cancelled") return "cancelled";
  if (debt.status === "settled") return "settled";
  const open = billsForDebt(bills, debt.id).filter(
    (bill) => bill.status === "pending" && effectiveBillStatus(bill, today) !== "paid",
  );
  return open.length === 0 ? "settled" : "active";
}

export function debtProgress(debt: Debt, bills: Bill[], today: string): DebtProgress {
  const debtBills = billsForDebt(bills, debt.id);
  const paidInApp = debtBills.filter((bill) => bill.status === "paid");
  const open = debtBills.filter((bill) => bill.status === "pending");
  const overdue = open.filter((bill) => effectiveBillStatus(bill, today) === "overdue");

  const paidInAppCents = paidInApp.reduce((total, bill) => total + bill.amountCents, 0);
  const initialPaidCents = debt.initialPaidInstallments * debt.installmentCents;
  const remainingCents = open.reduce((total, bill) => total + bill.amountCents, 0);

  const paidCount = debt.initialPaidInstallments + paidInApp.length;
  const pendingCount = open.length;
  const progressPercent =
    debt.totalInstallments === 0
      ? 0
      : Math.min(100, Math.round((paidCount / debt.totalInstallments) * 100));

  const sortedOpen = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const sortedPaid = [...paidInApp].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const nextDueDate = sortedOpen[0]?.dueDate ?? null;
  const payoffDate =
    sortedOpen[sortedOpen.length - 1]?.dueDate ??
    sortedPaid[sortedPaid.length - 1]?.dueDate ??
    null;

  return {
    paidCount,
    initialPaidCount: debt.initialPaidInstallments,
    paidInAppCount: paidInApp.length,
    pendingCount,
    overdueCount: overdue.length,
    paidCents: initialPaidCents + paidInAppCents,
    remainingCents,
    progressPercent,
    nextDueDate,
    payoffDate,
    status: effectiveDebtStatus(debt, bills, today),
  };
}

export type DebtsSummary = {
  /** Dívidas com parcelas em aberto. */
  activeCount: number;
  /** Saldo devedor total das dívidas ativas. */
  pendingCents: number;
  /** Parcelas em aberto somadas das dívidas ativas. */
  pendingInstallments: number;
  /** Próximo vencimento entre todas as dívidas ativas. */
  nextDue: { debtId: string; debtName: string; dueDate: string; amountCents: number } | null;
};

export function summarizeDebts(debts: Debt[], bills: Bill[], today: string): DebtsSummary {
  const summary: DebtsSummary = {
    activeCount: 0,
    pendingCents: 0,
    pendingInstallments: 0,
    nextDue: null,
  };

  for (const debt of debts) {
    const progress = debtProgress(debt, bills, today);
    if (progress.status !== "active") continue;
    summary.activeCount += 1;
    summary.pendingCents += progress.remainingCents;
    summary.pendingInstallments += progress.pendingCount;
  }

  const upcoming = debts
    .filter((debt) => effectiveDebtStatus(debt, bills, today) === "active")
    .map((debt) => {
      const open = billsForDebt(bills, debt.id)
        .filter((bill) => bill.status === "pending")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
      return open ? { debtId: debt.id, debtName: debt.name, dueDate: open.dueDate, amountCents: open.amountCents } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  summary.nextDue = upcoming[0] ?? null;
  return summary;
}

export type DebtSchedulePreview = {
  /** Total de parcelas ainda a vencer (geradas como bills). */
  remainingInstallments: number;
  /** Primeiro vencimento pendente. */
  firstDueDate: string;
  /** Último vencimento pendente (quitação prevista). */
  lastDueDate: string;
  /** Saldo devedor estimado (remaining × valor da parcela). */
  remainingCents: number;
  /** Valor total previsto do contrato (total × parcela). */
  contractTotalCents: number;
};

/**
 * Prévia do cronograma ao cadastrar/editar: calcula datas e totais sem
 * tocar na persistência — usada no formulário antes de salvar.
 */
export function previewDebtSchedule(input: {
  installmentCents: number;
  totalInstallments: number;
  initialPaidInstallments: number;
  firstPendingDueDate: string;
}): DebtSchedulePreview {
  const remainingInstallments = Math.max(
    0,
    input.totalInstallments - input.initialPaidInstallments,
  );
  const lastDueDate =
    remainingInstallments === 0
      ? input.firstPendingDueDate
      : addMonthsToDate(input.firstPendingDueDate, remainingInstallments - 1);

  return {
    remainingInstallments,
    firstDueDate: input.firstPendingDueDate,
    lastDueDate,
    remainingCents: remainingInstallments * input.installmentCents,
    contractTotalCents: input.totalInstallments * input.installmentCents,
  };
}

/** Dia habitual de vencimento (1–31) derivado da data. */
export function dueDayOf(date: string): number {
  return Number(date.slice(8, 10));
}
