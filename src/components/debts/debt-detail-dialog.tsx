"use client";

import { useMemo } from "react";
import { CheckCircle2, CalendarClock, Pencil, Undo2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useBills } from "@/hooks/use-bills";
import { useDebts } from "@/hooks/use-debts";
import { useHydrated } from "@/hooks/use-sidebar-collapsed";
import { effectiveBillStatus } from "@/lib/bills/finance";
import type { Bill } from "@/lib/bills/types";
import { billsForDebt, debtProgress } from "@/lib/debts/finance";
import type { Debt } from "@/lib/debts/types";
import { accountLabel } from "@/lib/transactions/accounts";
import { categoryLabel } from "@/lib/transactions/categories";
import { todayISODate } from "@/lib/transactions/finance";
import { formatCents } from "@/lib/transactions/money";
import { formatDate, formatFullDate } from "@/lib/format";
import { cn } from "cn";

type DebtDetailDialogProps = {
  debt: Debt | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (debt: Debt) => void;
  onSettleEarly: (debt: Debt) => void;
  onCancel: (debt: Debt) => void;
  onPayBill: (bill: Bill) => void;
  onUnpayBill: (bill: Bill) => void;
};

function installmentBadge(bill: Bill, today: string) {
  const status = effectiveBillStatus(bill, today);
  if (status === "paid") {
    return <Badge variant="outline" className="border-transparent bg-primary/10 text-primary text-[11px]">Paga</Badge>;
  }
  if (status === "overdue") {
    return <Badge variant="outline" className="border-transparent bg-destructive/10 text-destructive text-[11px]">Vencida</Badge>;
  }
  return <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground text-[11px]">Pendente</Badge>;
}

export function DebtDetailDialog({
  debt,
  onOpenChange,
  onEdit,
  onSettleEarly,
  onCancel,
  onPayBill,
  onUnpayBill,
}: DebtDetailDialogProps) {
  const { bills } = useBills();
  const { status: debtsStatus } = useDebts();

  // Datas só são lidas após a hidratação (evita new Date() no prerender).
  const hydrated = useHydrated();
  const open = debt !== null;
  const today = hydrated ? todayISODate() : "1970-01-01";

  const debtBills = useMemo(
    () => (debt ? billsForDebt(bills, debt.id) : []),
    [bills, debt],
  );
  const progress = useMemo(
    () => (debt ? debtProgress(debt, bills, today) : null),
    [debt, bills, today],
  );

  if (!debt || !progress) {
    return null;
  }

  const isActive = progress.status === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {debt.name}
            {progress.status === "cancelled" && (
              <Badge variant="secondary" className="text-[11px]">Cancelada</Badge>
            )}
            {progress.status === "settled" && (
              <Badge variant="outline" className="border-transparent bg-primary/10 text-primary text-[11px]">
                Quitada
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {debt.creditor} · {categoryLabel(debt.categoryId)} · {accountLabel(debt.accountId)}
            {debt.closedAt && ` · encerrada em ${formatDate(debt.closedAt)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium tabular-nums text-foreground">
                {progress.paidCount}/{debt.totalInstallments} parcelas ({progress.progressPercent}%)
              </span>
            </div>
            <Progress value={progress.progressPercent} aria-label="Progresso da dívida" />
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Valor já quitado</p>
              <p className="mt-1 font-semibold tabular-nums text-foreground">
                {formatCents(progress.paidCents)}
              </p>
              {progress.initialPaidCount > 0 && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  inclui {progress.initialPaidCount} paga(s) anterior(es) ao cadastro
                </p>
              )}
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Saldo devedor estimado</p>
              <p className="mt-1 font-semibold tabular-nums text-foreground">
                {formatCents(progress.remainingCents)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {progress.pendingCount} parcela(s) em aberto
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-muted p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock aria-hidden className="size-3.5" /> Próximo vencimento
              </p>
              <p className="mt-1 font-medium tabular-nums text-foreground">
                {progress.nextDueDate ? formatDate(progress.nextDueDate) : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Quitação prevista</p>
              <p className="mt-1 font-medium tabular-nums text-foreground">
                {progress.payoffDate ? formatFullDate(progress.payoffDate) : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Parcela de {formatCents(debt.installmentCents)} · mensal · dia{" "}
            {Number(debt.firstPendingDueDate.slice(8, 10))}
            {debt.totalOriginalCents !== null && (
              <>
                {" "}
                · total original {formatCents(debt.totalOriginalCents)} (soma das parcelas:{" "}
                {formatCents(debt.totalInstallments * debt.installmentCents)})
              </>
            )}
          </div>

          {debt.notes && (
            <p className="text-xs text-muted-foreground">Observações: {debt.notes}</p>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-foreground">Parcelas</h4>
          {debtBills.length === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-4 text-center text-xs text-muted-foreground">
              Nenhuma parcela registrada no app
              {progress.initialPaidCount > 0
                ? ` — ${progress.initialPaidCount} paga(s) antes do cadastro.`
                : "."}
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg bg-muted">
              {debtBills.map((bill) => {
                const status = effectiveBillStatus(bill, today);
                return (
                  <li key={bill.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        Parcela {bill.installmentNumber}/{bill.totalInstallments}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Vence em {formatDate(bill.dueDate)}
                        {bill.paidAt && ` · paga em ${formatDate(bill.paidAt)}`}
                      </p>
                    </div>
                    <p className="shrink-0 tabular-nums text-foreground">
                      {formatCents(bill.amountCents)}
                    </p>
                    {installmentBadge(bill, today)}
                    {status !== "paid" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onPayBill(bill)}
                        aria-label={`Marcar parcela ${bill.installmentNumber} como paga`}
                        title="Marcar como paga"
                        className="text-primary hover:text-primary"
                      >
                        <CheckCircle2 aria-hidden />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onUnpayBill(bill)}
                        aria-label={`Desfazer pagamento da parcela ${bill.installmentNumber}`}
                        title="Desfazer pagamento"
                      >
                        <Undo2 aria-hidden />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {isActive && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(debt)}>
              <Pencil aria-hidden />
              Editar dívida
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onSettleEarly(debt)}>
              <CheckCircle2 aria-hidden />
              Encerrar (quitação antecipada)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCancel(debt)}
              className={cn("text-destructive hover:text-destructive")}
            >
              <XCircle aria-hidden />
              Cancelar dívida
            </Button>
          </div>
        )}
        {!isActive && debtsStatus === "ready" && (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            {progress.status === "settled"
              ? "Dívida quitada — histórico preservado."
              : "Dívida cancelada — parcelas pendentes descartadas e histórico preservado."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
