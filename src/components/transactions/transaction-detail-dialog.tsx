"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTransactionCategories } from "@/hooks/use-transactions";
import { formatFullDate } from "@/lib/format";
import { accountLabel, paymentMethodLabel } from "@/lib/transactions/accounts";
import { categoryLabel } from "@/lib/transactions/categories";
import { formatSignedCents } from "@/lib/transactions/money";
import type { Transaction } from "@/lib/transactions/types";
import { cn } from "cn";

type TransactionDetailDialogProps = {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

export function TransactionDetailDialog({
  transaction,
  onOpenChange,
}: TransactionDetailDialogProps) {
  const categories = useTransactionCategories();
  const open = Boolean(transaction);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">{transaction?.description ?? "Transação"}</DialogTitle>
          <DialogDescription>
            {transaction ? formatFullDate(transaction.date) : ""}
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="grid gap-1">
            <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-3 py-3">
              <span className="text-xs font-medium text-muted-foreground">Valor</span>
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  transaction.type === "income" ? "text-primary" : "text-destructive",
                )}
              >
                {formatSignedCents(transaction.amountCents, transaction.type)}
              </span>
            </div>

            <div className="divide-y divide-border">
              <DetailRow
                label="Tipo"
                value={
                  <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                    {transaction.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                }
              />
              <DetailRow
                label="Categoria"
                value={categoryLabel(transaction.categoryId, categories)}
              />
              <DetailRow label="Conta financeira" value={accountLabel(transaction.accountId)} />
              <DetailRow
                label="Forma de pagamento"
                value={paymentMethodLabel(transaction.paymentMethodId)}
              />
              <DetailRow label="Observações" value={transaction.notes?.trim() || "—"} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
