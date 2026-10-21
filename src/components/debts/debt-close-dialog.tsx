"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBills } from "@/hooks/use-bills";
import { useDebts } from "@/hooks/use-debts";
import { useHydrated } from "@/hooks/use-sidebar-collapsed";
import { billsForDebt, debtProgress } from "@/lib/debts/finance";
import type { Debt } from "@/lib/debts/types";
import { todayISODate } from "@/lib/transactions/finance";
import { formatCents } from "@/lib/transactions/money";
import { formatDate } from "@/lib/format";

type DebtCloseKind = "settle" | "cancel";

type DebtCloseDialogProps = {
  debt: Debt | null;
  kind: DebtCloseKind;
  onOpenChange: (open: boolean) => void;
};

const COPY: Record<
  DebtCloseKind,
  { title: string; description: string; confirmLabel: string; impactIntro: string; success: string }
> = {
  settle: {
    title: "Encerrar dívida (quitação antecipada)",
    description:
      "As parcelas pendentes serão descartadas sem virar pagamentos fictícios. As parcelas já quitadas são preservadas no histórico.",
    confirmLabel: "Encerrar dívida",
    impactIntro: "Isto vai:",
    success: "Dívida encerrada com quitação antecipada.",
  },
  cancel: {
    title: "Cancelar dívida",
    description:
      "A dívida sai da lista de ativas. Parcelas já pagas e o histórico são preservados; as pendentes serão descartadas.",
    confirmLabel: "Cancelar dívida",
    impactIntro: "Isto vai:",
    success: "Dívida cancelada.",
  },
};

export function DebtCloseDialog({ debt, kind, onOpenChange }: DebtCloseDialogProps) {
  const { settleEarly, cancel } = useDebts();
  const { bills } = useBills();
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Datas só são lidas após a hidratação (evita new Date() no prerender).
  const hydrated = useHydrated();
  const open = debt !== null;
  const copy = COPY[kind];
  const today = hydrated ? todayISODate() : "1970-01-01";

  const impact = useMemo(() => {
    if (!debt) return null;
    const progress = debtProgress(debt, bills, today);
    const pendingBills = billsForDebt(bills, debt.id).filter((bill) => bill.status === "pending");
    return { progress, pendingBills };
  }, [debt, bills, today]);

  async function handleConfirm() {
    if (!debt || isSaving) return;
    setIsSaving(true);
    setSubmitError(null);
    try {
      if (kind === "settle") {
        await settleEarly(debt.id);
      } else {
        await cancel(debt.id);
      }
      onOpenChange(false);
    } catch {
      setSubmitError("Não foi possível concluir a operação. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!debt || !impact) return null;

  const { progress, pendingBills } = impact;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {debt.name} · {debt.creditor}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <p className="text-muted-foreground">{copy.description}</p>

          <div className="grid gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{copy.impactIntro}</p>
            <ul className="grid list-disc gap-1 pl-4">
              <li>
                Descartar {pendingBills.length}{" "}
                {pendingBills.length === 1 ? "parcela pendente" : "parcelas pendentes"} (
                {formatCents(progress.remainingCents)}).
              </li>
              <li>
                Preservar {progress.paidInAppCount}{" "}
                {progress.paidInAppCount === 1 ? "parcela quitada no app" : "parcelas quitadas no app"}
                {progress.initialPaidCount > 0 && (
                  <>
                    {" "}
                    + {progress.initialPaidCount} quitada(s) anterior(es) ao cadastro
                  </>
                )}
                .
              </li>
              {kind === "settle" && (
                <li>
                  Encerrar a dívida em {formatDate(today)} com quitação antecipada —{" "}
                  <span className="font-medium text-foreground">nenhum pagamento fictício</span> será
                  criado para as parcelas descartadas.
                </li>
              )}
              {kind === "cancel" && (
                <li>
                  Cancelar a dívida; o histórico permanece disponível para consulta.
                </li>
              )}
            </ul>
          </div>

          {submitError && (
            <p role="alert" className="text-xs text-destructive">
              {submitError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className={kind === "cancel" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {isSaving ? <Loader2 aria-hidden className="animate-spin" /> : kind === "settle" ? <CheckCircle2 aria-hidden /> : <XCircle aria-hidden />}
            {isSaving ? "Processando..." : copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
