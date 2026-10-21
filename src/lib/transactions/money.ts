import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { centsToReais } from "./finance";

/**
 * Formatação de valores monetários para exibição.
 * Os cálculos internos usam centavos (inteiros); a conversão para reais
 * acontece somente aqui, na fronteira de exibição.
 */

export { centsToReais, parseAmountToCents } from "./finance";

export function formatCents(cents: number): string {
  return formatCurrency(centsToReais(cents));
}

export function formatSignedCents(cents: number, type: "income" | "expense"): string {
  return formatSignedCurrency(centsToReais(cents), type);
}
