"use client";

import { CalendarClock, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBills } from "@/hooks/use-bills";
import { debtProgress } from "@/lib/debts/finance";
import type { Debt } from "@/lib/debts/types";
import { accountLabel } from "@/lib/transactions/accounts";
import { categoryLabel } from "@/lib/transactions/categories";
import { todayISODate } from "@/lib/transactions/finance";
import { formatCents } from "@/lib/transactions/money";
import { formatDate } from "@/lib/format";

type DebtsListProps = {
  debts: Debt[];
  onDetails: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
};

function statusBadge(status: "active" | "settled" | "cancelled") {
  if (status === "settled") {
    return (
      <Badge variant="outline" className="border-transparent bg-primary/10 text-primary text-[11px]">
        Quitada
      </Badge>
    );
  }
  if (status === "cancelled") {
    return <Badge variant="secondary" className="text-[11px]">Cancelada</Badge>;
  }
  return (
    <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground text-[11px]">
      Ativa
    </Badge>
  );
}

export function DebtsList({ debts, onDetails, onEdit }: DebtsListProps) {
  const { bills } = useBills();
  const today = todayISODate();

  return (
    <ul className="grid gap-3">
      {debts.map((debt) => {
        const progress = debtProgress(debt, bills, today);
        const hasOverdue = progress.overdueCount > 0;
        const isActive = progress.status === "active";

        return (
          <li
            key={debt.id}
            className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="grid min-w-0 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{debt.name}</p>
                {statusBadge(progress.status)}
                {hasOverdue && (
                  <Badge
                    variant="outline"
                    className="border-transparent bg-destructive/10 text-destructive text-[11px]"
                  >
                    {progress.overdueCount} vencida(s)
                  </Badge>
                )}
              </div>
              <p className="min-w-0 text-xs break-words text-muted-foreground">
                {debt.creditor} · {categoryLabel(debt.categoryId)} · {accountLabel(debt.accountId)}{" "}
                · parcela de {formatCents(debt.installmentCents)} · {debt.totalInstallments}x
              </p>

              <div className="grid max-w-md gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {progress.paidCount}/{debt.totalInstallments} parcelas
                  </span>
                  <span className="tabular-nums text-foreground">
                    saldo {formatCents(progress.remainingCents)}
                  </span>
                </div>
                <Progress value={progress.progressPercent} aria-label={`Progresso de ${debt.name}`} />
              </div>

              {isActive && progress.nextDueDate && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock aria-hidden className="size-3.5" />
                  Próximo vencimento: {formatDate(progress.nextDueDate)}
                  {progress.payoffDate && <> · quitação prevista em {formatDate(progress.payoffDate)}</>}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
              <Button type="button" variant="outline" size="sm" onClick={() => onDetails(debt)}>
                <Eye aria-hidden />
                Detalhes
              </Button>
              {isActive && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(debt)}>
                  <Pencil aria-hidden />
                  Editar
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
