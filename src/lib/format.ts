const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatSignedCurrency(value: number, type: "income" | "expense"): string {
  const sign = type === "income" ? "+" : "−";
  return `${sign} ${currencyFormatter.format(value)}`;
}

/** Aceita datas no formato "YYYY-MM-DD" (fuso UTC preservado). */
export function formatDate(value: string): string {
  return dayMonthFormatter.format(new Date(`${value}T00:00:00Z`)).replace(".", "");
}

export function formatFullDate(value: string): string {
  return fullDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
