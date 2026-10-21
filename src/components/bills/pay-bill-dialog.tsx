"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBills } from "@/hooks/use-bills";
import type { Bill, BillType } from "@/lib/bills/types";
import { transactionTypeForBill } from "@/lib/bills/finance";
import { defaultPaymentMethods } from "@/lib/transactions/accounts";
import { formatDate } from "@/lib/format";
import { formatCents } from "@/lib/transactions/money";

type PayBillDialogProps = {
  bill: Bill | null;
  type: BillType;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirma a baixa da conta: cria um lançamento real (despesa para contas a
 * pagar, receita para contas a receber) vinculado à conta quitada.
 */
export function PayBillDialog({ bill, type, onOpenChange }: PayBillDialogProps) {
  const { pay } = useBills();
  const [paymentMethodId, setPaymentMethodId] = useState(defaultPaymentMethods[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = bill !== null;
  const isPayable = type === "payable";

  async function handleConfirm() {
    if (!bill || isSaving) return; // evita envios duplicados durante o processamento

    setIsSaving(true);
    setError(null);
    try {
      await pay(bill.id, paymentMethodId);
      onOpenChange(false);
    } catch {
      setError("Não foi possível registrar a baixa. Tente novamente.");
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
          <DialogTitle>{isPayable ? "Confirmar pagamento" : "Confirmar recebimento"}</DialogTitle>
          <DialogDescription>
            A baixa cria um lançamento{" "}
            {transactionTypeForBill(type) === "expense" ? "de despesa" : "de receita"} em Transações
            com os mesmos valores desta conta.
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
            {bill.totalInstallments > 1 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Parcela</span>
                <span className="tabular-nums text-foreground">
                  {bill.installmentNumber} de {bill.totalInstallments}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="pay-bill-method">{isPayable ? "Forma de pagamento" : "Forma de recebimento"}</Label>
          <Select value={paymentMethodId} onValueChange={setPaymentMethodId} disabled={isSaving}>
            <SelectTrigger id="pay-bill-method" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {defaultPaymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            {isSaving ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden />
            )}
            {isSaving ? "Registrando..." : isPayable ? "Registrar pagamento" : "Registrar recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
