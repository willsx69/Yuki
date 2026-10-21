import type { Transaction, TransactionType } from "./types";

/**
 * Regras de cálculo financeiro — usadas pelo dashboard e pela página de
 * transações, garantindo a mesma matemática em todas as telas.
 * Todas as funções são puras e trabalham em centavos (inteiros).
 */

/** Chave de mês no formato "YYYY-MM". */
export type MonthKey = string;

const monthShortFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});

const monthLongFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Extrai o mês ("YYYY-MM") de uma data "YYYY-MM-DD". */
export function monthKeyOf(date: string): MonthKey {
  return date.slice(0, 7);
}

export function currentMonthKey(now = new Date()): MonthKey {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function todayISODate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftMonthKey(monthKey: MonthKey, delta: number): MonthKey {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonthDate(monthKey: MonthKey): string {
  return `${monthKey}-01`;
}

export function endOfMonthDate(monthKey: MonthKey): string {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}

/** Rótulo curto do mês, ex.: "Out". */
export function monthLabel(monthKey: MonthKey): string {
  const [year, month] = monthKey.split("-").map(Number);
  const label = monthShortFormatter
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Rótulo longo do mês, ex.: "outubro de 2026". */
export function monthLongLabel(monthKey: MonthKey): string {
  const [year, month] = monthKey.split("-").map(Number);
  return monthLongFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date === b.date) {
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    }
    return b.date.localeCompare(a.date);
  });
}

/** Meses presentes nos dados (mais o mês de referência), do mais recente ao mais antigo. */
export function monthOptionsFor(
  transactions: Transaction[],
  referenceMonth: MonthKey = currentMonthKey(),
): MonthKey[] {
  const months = new Set<MonthKey>(transactions.map((transaction) => monthKeyOf(transaction.date)));
  months.add(referenceMonth);
  return [...months].sort().reverse();
}

export type PeriodPreset = "current-month" | "previous-month" | "last-3-months" | "custom" | "all";

export type PeriodRange = { from?: string; to?: string };

export type CustomPeriod = { from?: string; to?: string };

/** Converte o período selecionado em intervalo de datas ("YYYY-MM-DD"). */
export function resolvePeriod(
  preset: PeriodPreset,
  referenceMonth: MonthKey = currentMonthKey(),
  custom: CustomPeriod = {},
): PeriodRange {
  switch (preset) {
    case "current-month":
      return { from: startOfMonthDate(referenceMonth), to: endOfMonthDate(referenceMonth) };
    case "previous-month": {
      const month = shiftMonthKey(referenceMonth, -1);
      return { from: startOfMonthDate(month), to: endOfMonthDate(month) };
    }
    case "last-3-months": {
      const start = shiftMonthKey(referenceMonth, -2);
      return { from: startOfMonthDate(start), to: endOfMonthDate(referenceMonth) };
    }
    case "custom":
      return { from: custom.from || undefined, to: custom.to || undefined };
    case "all":
    default:
      return {};
  }
}

export type TransactionQuery = {
  search?: string;
  type?: "all" | TransactionType;
  categoryId?: string;
  from?: string;
  to?: string;
};

export function filterTransactions(
  transactions: Transaction[],
  query: TransactionQuery,
): Transaction[] {
  const search = query.search?.trim().toLowerCase() ?? "";

  return transactions.filter((transaction) => {
    if (query.type && query.type !== "all" && transaction.type !== query.type) return false;
    if (query.categoryId && transaction.categoryId !== query.categoryId) return false;
    if (query.from && transaction.date < query.from) return false;
    if (query.to && transaction.date > query.to) return false;
    if (search) {
      const haystack = `${transaction.description} ${transaction.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export type PeriodSummary = {
  incomeCents: number;
  expenseCents: number;
  /** Receitas menos despesas do período. */
  netCents: number;
  count: number;
  incomeCount: number;
  expenseCount: number;
  /** Soma dos valores movimentados (receitas + despesas). */
  movedCents: number;
};

export function summarizeTransactions(transactions: Transaction[]): PeriodSummary {
  let incomeCents = 0;
  let expenseCents = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const transaction of transactions) {
    if (transaction.type === "income") {
      incomeCents += transaction.amountCents;
      incomeCount += 1;
    } else {
      expenseCents += transaction.amountCents;
      expenseCount += 1;
    }
  }

  return {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    count: transactions.length,
    incomeCount,
    expenseCount,
    movedCents: incomeCents + expenseCents,
  };
}

export type CategoryTotal = {
  categoryId: string;
  amountCents: number;
  count: number;
};

/** Total de despesas por categoria, do maior para o menor valor. */
export function expenseTotalsByCategory(transactions: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const entry = totals.get(transaction.categoryId) ?? {
      categoryId: transaction.categoryId,
      amountCents: 0,
      count: 0,
    };
    entry.amountCents += transaction.amountCents;
    entry.count += 1;
    totals.set(transaction.categoryId, entry);
  }

  return [...totals.values()].sort((a, b) => b.amountCents - a.amountCents);
}

export type MonthlyFlowPoint = {
  monthKey: MonthKey;
  label: string;
  incomeCents: number;
  expenseCents: number;
};

/**
 * Série histórica mês a mês (receitas e despesas separadas por período),
 * terminando em `endMonth` e cobrindo os últimos `months` meses.
 */
export function monthlyFlowSeries(
  transactions: Transaction[],
  endMonth: MonthKey,
  months = 6,
): MonthlyFlowPoint[] {
  const totals = new Map<MonthKey, { incomeCents: number; expenseCents: number }>();

  for (const transaction of transactions) {
    const key = monthKeyOf(transaction.date);
    const entry = totals.get(key) ?? { incomeCents: 0, expenseCents: 0 };
    if (transaction.type === "income") {
      entry.incomeCents += transaction.amountCents;
    } else {
      entry.expenseCents += transaction.amountCents;
    }
    totals.set(key, entry);
  }

  const points: MonthlyFlowPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const key = shiftMonthKey(endMonth, -offset);
    const entry = totals.get(key) ?? { incomeCents: 0, expenseCents: 0 };
    points.push({
      monthKey: key,
      label: monthLabel(key),
      incomeCents: entry.incomeCents,
      expenseCents: entry.expenseCents,
    });
  }
  return points;
}

/** Variação percentual arredondada em relação ao período anterior. */
export function variationPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Converte o texto digitado pelo usuário em centavos.
 * Aceita "1234", "1234.56", "1234,56", "1.234,56", "R$ 1.234,56".
 * Sem separador de milhar, o ponto é tratado como decimal.
 * Retorna `null` quando o texto não representa um número válido.
 */
export function parseAmountToCents(input: string): number | null {
  const withoutSymbol = input.replace(/r\$/gi, "");
  let normalized = withoutSymbol.replace(/\s/g, "").replace(/[^0-9.,]/g, "");
  if (!normalized) return null;

  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  if (!/^\d*\.?\d*$/.test(normalized) || normalized === "." || normalized === "") {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Converte centavos em reais (apenas para exibição). */
export function centsToReais(cents: number): number {
  return cents / 100;
}
