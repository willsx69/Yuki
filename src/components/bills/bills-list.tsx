"use client";

import { CheckCircle2, Pencil, Trash2, Undo2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransactionCategories } from "@/hooks/use-transactions";
import { effectiveBillStatus, type EffectiveBillStatus } from "@/lib/bills/finance";
import { formatDate } from "@/lib/format";
import { accountLabel } from "@/lib/transactions/accounts";
import { categoryLabel } from "@/lib/transactions/categories";
import { formatCents } from "@/lib/transactions/money";
import type { Bill, BillType } from "@/lib/bills/types";
import { cn } from "cn";

type BillsListProps = {
  bills: Bill[];
  today: string;
  type: BillType;
  onPay: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onUnpay: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
};

function statusLabel(status: EffectiveBillStatus): string {
  if (status === "paid") return "Quitada";
  if (status === "overdue") return "Vencida";
  return "Pendente";
}

function statusBadgeClass(status: EffectiveBillStatus): string {
  if (status === "paid") return "border-transparent bg-primary/10 text-primary";
  if (status === "overdue") return "border-transparent bg-destructive/10 text-destructive";
  return "border-transparent bg-muted text-muted-foreground";
}

export function BillsList({ bills, today, type, onPay, onEdit, onUnpay, onDelete }: BillsListProps) {
  const categories = useTransactionCategories();
  const payLabel = type === "payable" ? "Pagar" : "Receber";

  function RowActions({ bill }: { bill: Bill }) {
    const status = effectiveBillStatus(bill, today);
    return (
      <div className="flex items-center justify-end gap-1">
        {status !== "paid" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onPay(bill)}
              aria-label={`${payLabel} ${bill.description}`}
              title={payLabel}
              className="text-primary hover:text-primary"
            >
              <CheckCircle2 aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(bill)}
              aria-label={`Editar ${bill.description}`}
              title="Editar"
            >
              <Pencil aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onUnpay(bill)}
            aria-label={`Desfazer baixa de ${bill.description}`}
            title="Desfazer baixa"
          >
            <Undo2 aria-hidden />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(bill)}
          aria-label={`Excluir ${bill.description}`}
          title="Excluir"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    );
  }

  function InstallmentBadge({ bill }: { bill: Bill }) {
    if (bill.totalInstallments <= 1) return null;
    return (
      <Badge variant="outline" className="text-[11px] text-muted-foreground">
        {bill.installmentNumber}/{bill.totalInstallments}
      </Badge>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
      {/* Tabela para telas médias e grandes */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Conta financeira</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bills.map((bill) => {
              const status = effectiveBillStatus(bill, today);
              return (
                <tr key={bill.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(bill.dueDate)}
                  </td>
                  <td className="max-w-56 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Wallet aria-hidden className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{bill.description}</p>
                        {bill.totalInstallments > 1 && (
                          <p className="truncate text-xs text-muted-foreground">
                            Parcela {bill.installmentNumber} de {bill.totalInstallments}
                          </p>
                        )}
                      </div>
                      <InstallmentBadge bill={bill} />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {categoryLabel(bill.categoryId, categories)}
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-muted-foreground lg:table-cell">
                    {accountLabel(bill.accountId)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">
                    {formatCents(bill.amountCents)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant="outline" className={cn("text-[11px]", statusBadgeClass(status))}>
                      {statusLabel(status)}
                    </Badge>
                    {bill.paidAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Baixa em {formatDate(bill.paidAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RowActions bill={bill} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cartões para telas pequenas */}
      <ul className="divide-y divide-border md:hidden">
        {bills.map((bill) => {
          const status = effectiveBillStatus(bill, today);
          return (
            <li key={bill.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Wallet aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{bill.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryLabel(bill.categoryId, categories)} · {accountLabel(bill.accountId)}
                  </p>
                  {bill.totalInstallments > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Parcela {bill.installmentNumber} de {bill.totalInstallments}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {formatCents(bill.amountCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(bill.dueDate)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={cn("text-[11px]", statusBadgeClass(status))}>
                  {statusLabel(status)}
                </Badge>
                <RowActions bill={bill} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
