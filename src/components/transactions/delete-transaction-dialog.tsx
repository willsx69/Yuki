"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTransactions } from "@/hooks/use-transactions";
import { formatFullDate } from "@/lib/format";
import { formatCents } from "@/lib/transactions/money";
import type { Transaction } from "@/lib/transactions/types";

type DeleteTransactionDialogProps = {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
}: DeleteTransactionDialogProps) {
  const { remove } = useTransactions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(transaction);

  async function handleDelete() {
    if (!transaction || isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      await remove(transaction.id);
      onOpenChange(false);
    } catch {
      setError("Não foi possível excluir a transação. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir transação</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O lançamento sai dos resumos e dos gráficos na hora.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-lg bg-muted/60 px-3 py-3">
            <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatCents(transaction.amountCents)} · {formatFullDate(transaction.date)}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-3 sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Trash2 aria-hidden />
            )}
            {isDeleting ? "Excluindo..." : "Excluir transação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
