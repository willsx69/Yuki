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
import { useBills } from "@/hooks/use-bills";
import type { Bill, BillType } from "@/lib/bills/types";
import { formatDate } from "@/lib/format";
import { formatCents } from "@/lib/transactions/money";

type DeleteBillDialogProps = {
  bill: Bill | null;
  type: BillType;
  onOpenChange: (open: boolean) => void;
};

export function DeleteBillDialog({ bill, type, onOpenChange }: DeleteBillDialogProps) {
  const { remove } = useBills();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = bill !== null;

  async function handleConfirm() {
    if (!bill || isSaving) return; // evita envios duplicados durante o processamento

    setIsSaving(true);
    setError(null);
    try {
      await remove(bill.id);
      onOpenChange(false);
    } catch {
      setError("Não foi possível excluir a conta. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
          setIsSaving(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A conta sai da lista e dos cálculos de
            {type === "payable" ? " contas a pagar" : " contas a receber"}.
            {bill?.linkedTransactionId &&
              " O lançamento criado na baixa também será excluído dos seus lançamentos."}
          </DialogDescription>
        </DialogHeader>

        {bill && (
          <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Conta</span>
              <span className="text-right font-medium text-foreground">{bill.description}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Vencimento</span>
              <span className="tabular-nums text-foreground">{formatDate(bill.dueDate)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCents(bill.amountCents)}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 aria-hidden className="animate-spin" /> : <Trash2 aria-hidden />}
            {isSaving ? "Excluindo..." : "Excluir conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
