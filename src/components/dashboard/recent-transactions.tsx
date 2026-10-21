import Link from "next/link";
import { ArrowRight, Landmark, ShoppingCart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { formatSignedCents } from "@/lib/transactions/money";
import type { TransactionType } from "@/lib/transactions/types";
import { cn } from "cn";

const accountIcons = [Landmark, Wallet, ShoppingCart] as const;

/** Linha pronta para exibição, derivada dos dados reais ou de demonstração. */
export type RecentTransactionRow = {
  id: string;
  description: string;
  categoryLabel: string;
  accountLabel: string;
  date: string;
  amountCents: number;
  type: TransactionType;
};

type RecentTransactionsProps = {
  rows: RecentTransactionRow[];
  subtitle?: string;
  emptyMessage?: string;
};

export function RecentTransactions({
  rows,
  subtitle = "Últimos lançamentos registrados no período",
  emptyMessage = "Nenhuma transação registrada.",
}: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações recentes</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row, index) => (
              <li key={row.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    row.type === "income"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {(() => {
                    const Icon = accountIcons[index % accountIcons.length];
                    return <Icon aria-hidden className="size-4" />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{row.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.categoryLabel} · {row.accountLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      row.type === "income" ? "text-primary" : "text-destructive",
                    )}
                  >
                    {formatSignedCents(row.amountCents, row.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/transacoes">
            Ver todas as transações
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
