import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

export type UpcomingBillRow = {
  id: string;
  descricao: string;
  categoria: string;
  vencimento: string;
  valor: number;
  status: "pendente" | "agendada";
};

type UpcomingBillsProps = {
  rows: UpcomingBillRow[];
  isDemo: boolean;
};

export function UpcomingBills({ rows, isDemo }: UpcomingBillsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas contas</CardTitle>
        <p className="text-xs text-muted-foreground">
          {isDemo
            ? "Vencimentos dos próximos dias · dados de exemplo"
            : "Contas em aberto com vencimento próximo"}
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma conta próxima.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((bill) => (
              <li key={bill.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <CalendarClock aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{bill.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence em {formatDate(bill.vencimento)} · {bill.categoria}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(bill.valor)}
                  </p>
                  <Badge
                    variant={bill.status === "pendente" ? "secondary" : "outline"}
                    className="text-[11px]"
                  >
                    {bill.status === "pendente" ? "Pendente" : "Agendada"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/contas-a-pagar">
            Ver contas a pagar
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
