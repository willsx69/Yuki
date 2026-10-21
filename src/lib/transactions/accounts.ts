import type { Account, PaymentMethod } from "./types";

/**
 * Contas e formas de pagamento padrão.
 * O módulo completo de contas e carteiras será implementado em uma próxima
 * etapa; por enquanto são opções fixas usadas pelo formulário de transação.
 */
export const defaultAccounts: Account[] = [
  { id: "acc-checking", label: "Conta corrente" },
  { id: "acc-savings", label: "Poupança" },
  { id: "acc-wallet", label: "Carteira digital" },
  { id: "acc-cash", label: "Dinheiro" },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: "pay-pix", label: "Pix" },
  { id: "pay-debito", label: "Cartão de débito" },
  { id: "pay-credito", label: "Cartão de crédito" },
  { id: "pay-dinheiro", label: "Dinheiro" },
  { id: "pay-boleto", label: "Boleto" },
  { id: "pay-transferencia", label: "Transferência" },
];

export function accountLabel(accountId: string): string {
  return defaultAccounts.find((account) => account.id === accountId)?.label ?? "Não informada";
}

export function paymentMethodLabel(paymentMethodId: string): string {
  return (
    defaultPaymentMethods.find((method) => method.id === paymentMethodId)?.label ??
    "Não informada"
  );
}
