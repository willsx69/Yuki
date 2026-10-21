"use client";

import { useState } from "react";
import { Loader2, Undo2 } from "lucide-react";
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

type UnpayBillDialogProps = {
  bill: Bill | null;
  type: BillType;
  onOpenChange: (open: boolean) => void;
};

/**
 * Desfaz a baixa: a conta volta a pendente e o lançamento criado na baixa
 * é excluído dos lançamentos.
 */
export function UnpayBillDialog({ bill, type, onOpenChange }: UnpayBillDialogProps) {
  const { unpay } = useBills();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = bill !== null;

  async function handleConfirm() {
    if (!bill || isSaving) return; // evita envios duplicados durante o processamento

    setIsSaving(true);
    setError(null);
    try {
      await unpay(bill.id);
      onOpenChange(false);
    } catch {
      setError("Não foi possível desfazer a baixa. Tente novamente.");
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
          <DialogTitle>Desfazer baixa</DialogTitle>
          <DialogDescription>
            A conta volta a ficar pendente e o lançamento de{" "}
            {type === "payable" ? "despesa" : "receita"} criado na baixa será excluído.
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
          <Button type="button" onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? <Loader2 aria-hidden className="animate-spin" /> : <Undo2 aria-hidden />}
            {isSaving ? "Desfazendo..." : "Desfazer baixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
