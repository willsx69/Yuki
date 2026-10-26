import { monthKeyOf, type MonthKey } from "@/lib/transactions/finance";
import type { Bill, BillDraft, BillType } from "./types";

/**
 * Regras de cálculo do módulo de contas a pagar/receber (Etapa 3).
 * Funções puras, trabalhando em centavos (inteiros), reutilizando as
 * utilidades de mês/datas das transações para manter a mesma matemática.
 */

/** Conta a pagar vira despesa; conta a receber vira receita na baixa. */
export function transactionTypeForBill(type: BillType): "income" | "expense" {
  return type === "payable" ? "expense" : "income";
}

export type EffectiveBillStatus = "pending" | "overdue" | "paid";

/** Status exibido: pendente, vencida (atraso) ou quitada. */
export function effectiveBillStatus(bill: Bill, today: string): EffectiveBillStatus {
  if (bill.status === "paid") return "paid";
  return bill.dueDate < today ? "overdue" : "pending";
}

export type BillStatusFilter = "all" | "pending" | "overdue" | "paid";

export type BillQuery = {
  search?: string;
  status?: BillStatusFilter;
  categoryId?: string;
  /** Filtra pelo vencimento ("YYYY-MM-DD"). */
  from?: string;
  to?: string;
};

export function filterBills(bills: Bill[], query: BillQuery, today: string): Bill[] {
  const search = query.search?.trim().toLowerCase() ?? "";

  return bills.filter((bill) => {
    if (query.status && query.status !== "all") {
      if (effectiveBillStatus(bill, today) !== query.status) return false;
    }
    if (query.categoryId && bill.categoryId !== query.categoryId) return false;
    if (query.from && bill.dueDate < query.from) return false;
    if (query.to && bill.dueDate > query.to) return false;
    if (search) {
      const haystack = `${bill.description} ${bill.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

const STATUS_RANK: Record<EffectiveBillStatus, number> = { overdue: 0, pending: 1, paid: 2 };

/** Ordena por urgência (vencidas primeiro), vencimento e depois pagamento. */
export function sortBillsForList(bills: Bill[], today: string): Bill[] {
  return [...bills].sort((a, b) => {
    const rank = STATUS_RANK[effectiveBillStatus(a, today)] - STATUS_RANK[effectiveBillStatus(b, today)];
    if (rank !== 0) return rank;
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return (b.paidAt ?? "").localeCompare(a.paidAt ?? "");
  });
}

export type BillsSummary = {
  count: number;
  /** Soma de todas as contas do filtro. */
  totalCents: number;
  /** Pendentes + vencidas (ainda em aberto). */
  openCents: number;
  openCount: number;
  overdueCents: number;
  overdueCount: number;
  paidCents: number;
  paidCount: number;
};

export function summarizeBills(bills: Bill[], today: string): BillsSummary {
  const summary: BillsSummary = {
    count: bills.length,
    totalCents: 0,
    openCents: 0,
    openCount: 0,
    overdueCents: 0,
    overdueCount: 0,
    paidCents: 0,
    paidCount: 0,
  };

  for (const bill of bills) {
    const status = effectiveBillStatus(bill, today);
    summary.totalCents += bill.amountCents;
    if (status === "paid") {
      summary.paidCents += bill.amountCents;
      summary.paidCount += 1;
    } else {
      summary.openCents += bill.amountCents;
      summary.openCount += 1;
      if (status === "overdue") {
        summary.overdueCents += bill.amountCents;
        summary.overdueCount += 1;
      }
    }
  }

  return summary;
}

/** Meses com vencimento (mais o mês de referência), do mais recente ao mais antigo. */
export function monthOptionsForBills(
  bills: Bill[],
  referenceMonth: MonthKey = "1970-01",
): MonthKey[] {
  const months = new Set<MonthKey>(bills.map((bill) => monthKeyOf(bill.dueDate)));
  months.add(referenceMonth);
  return [...months].sort().reverse();
}

/** Data ("YYYY-MM-DD") resultante de somar meses, com ajuste para o fim do mês. */
export function addMonthsToDate(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const clamped = Math.min(day, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

/** Data futura (hoje + dias) no formato "YYYY-MM-DD". */
export function addDaysISO(today: string, days: number): string {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Divide o total em parcelas inteiras de centavos; o resto de centavos
 * é distribuído nas primeiras parcelas (a soma sempre fecha com o total).
 */
export function splitInstallments(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export type InstallmentPlanItem = {
  installmentNumber: number;
  dueDate: string;
  amountCents: number;
};

/** Plano de parcelas: valores por parcela e vencimentos mensais a partir da primeira data. */
export function planInstallments(
  amountCents: number,
  totalInstallments: number,
  firstDueDate: string,
): InstallmentPlanItem[] {
  const parts = splitInstallments(amountCents, totalInstallments);
  return parts.map((amount, index) => ({
    installmentNumber: index + 1,
    dueDate: addMonthsToDate(firstDueDate, index),
    amountCents: amount,
  }));
}

/**
 * Plano de parcelas de um rascunho (usado pelos repositórios local e
 * remoto, para que a matemática seja uma só):
 * - dívidas (perInstallmentAmount + debtId): cada parcela tem o mesmo valor
 *   e vencimentos mensais consecutivos a partir da data informada;
 * - contas avulsas: o total é dividido entre as parcelas.
 */
export function buildInstallmentPlan(draft: BillDraft): InstallmentPlanItem[] {
  const start = draft.installmentStart ?? 1;
  const generate = draft.installmentsToGenerate ?? draft.totalInstallments;

  if (draft.perInstallmentAmount && draft.debtId) {
    return Array.from({ length: generate }, (_, index) => ({
      installmentNumber: start + index,
      dueDate: addMonthsToDate(draft.dueDate, index),
      amountCents: draft.amountCents,
    }));
  }

  return planInstallments(draft.amountCents, draft.totalInstallments, draft.dueDate).slice(
    start - 1,
    start - 1 + generate,
  );
}

/**
 * Contas em aberto com vencimento até o horizonte (inclui vencidas),
 * das mais urgentes para as próximas — usado no "Próximas contas" do dashboard.
 */
export function billsDueSoon(bills: Bill[], today: string, maxDays = 7): Bill[] {
  const horizon = addDaysISO(today, maxDays);
  const upcoming = bills.filter(
    (bill) => bill.status === "pending" && bill.dueDate <= horizon,
  );
  return sortBillsForList(upcoming, today);
}

export type { MonthKey };
