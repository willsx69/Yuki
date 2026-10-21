"use client";

import { Eye, Landmark, Pencil, ShoppingCart, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionCategories } from "@/hooks/use-transactions";
import { formatDate } from "@/lib/format";
import { accountLabel, paymentMethodLabel } from "@/lib/transactions/accounts";
import { categoryLabel } from "@/lib/transactions/categories";
import { formatSignedCents } from "@/lib/transactions/money";
import type { Transaction } from "@/lib/transactions/types";
import { cn } from "cn";

const accountIcons = [Landmark, Wallet, ShoppingCart] as const;

type TransactionListProps = {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionList({
  transactions,
  onView,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const categories = useTransactionCategories();

  function RowActions({ transaction }: { transaction: Transaction }) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onView(transaction)}
          aria-label={`Ver detalhes de ${transaction.description}`}
          title="Ver detalhes"
        >
          <Eye aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(transaction)}
          aria-label={`Editar ${transaction.description}`}
          title="Editar"
        >
          <Pencil aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(transaction)}
          aria-label={`Excluir ${transaction.description}`}
          title="Excluir"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
      {/* Tabela para telas médias e grandes */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Conta</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Pagamento</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction, index) => {
              const Icon = accountIcons[index % accountIcons.length];
              return (
                <tr key={transaction.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="max-w-56 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg",
                          transaction.type === "income"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {transaction.description}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {transaction.type === "income" ? "Receita" : "Despesa"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {categoryLabel(transaction.categoryId, categories)}
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground lg:table-cell">
                    {accountLabel(transaction.accountId)}
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground lg:table-cell">
                    {paymentMethodLabel(transaction.paymentMethodId)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums",
                      transaction.type === "income" ? "text-primary" : "text-destructive",
                    )}
                  >
                    {formatSignedCents(transaction.amountCents, transaction.type)}
                  </td>
                  <td className="px-4 py-3">
                    <RowActions transaction={transaction} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cartões para telas pequenas */}
      <ul className="divide-y divide-border md:hidden">
        {transactions.map((transaction, index) => {
          const Icon = accountIcons[index % accountIcons.length];
          return (
            <li key={transaction.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    transaction.type === "income"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {transaction.description}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryLabel(transaction.categoryId, categories)} ·{" "}
                    {accountLabel(transaction.accountId)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      transaction.type === "income" ? "text-primary" : "text-destructive",
                    )}
                  >
                    {formatSignedCents(transaction.amountCents, transaction.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <RowActions transaction={transaction} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
