"use client";

import { useMemo, useState } from "react";
import { RefreshCw, ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { AddTransactionButton } from "@/components/dashboard/add-transaction-button";
import { CategoryExpenseChart } from "@/components/dashboard/category-expense-chart";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { RecentTransactions, type RecentTransactionRow } from "@/components/dashboard/recent-transactions";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { UpcomingBills, type UpcomingBillRow } from "@/components/dashboard/upcoming-bills";
import { useBillsContext } from "@/components/providers/bills-provider";
import { useTransactionsContext } from "@/components/providers/transactions-provider";
import { useHydrated } from "@/hooks/use-sidebar-collapsed";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { demoSummary, demoTransactions, demoUpcomingBills } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";
import { billsDueSoon, effectiveBillStatus } from "@/lib/bills/finance";
import { accountLabel } from "@/lib/transactions/accounts";
import { categoryLabel } from "@/lib/transactions/categories";
import {
  currentMonthKey,
  endOfMonthDate,
  expenseTotalsByCategory,
  filterTransactions,
  monthlyFlowSeries,
  monthKeyOf,
  monthLongLabel,
  shiftMonthKey,
  startOfMonthDate,
  summarizeTransactions,
  todayISODate,
  variationPercent,
} from "@/lib/transactions/finance";
import { centsToReais } from "@/lib/transactions/money";
import type { DataSourceMode } from "@/components/providers/transactions-provider";
import { cn } from "cn";

const MODE_OPTIONS = [
  { value: "mine", label: "Meus lançamentos" },
  { value: "demo", label: "Dados de exemplo" },
] as const;

/** Mês usado apenas nos cálculos intermediários antes da hidratação. */
const DEFAULT_MONTH = "1970-01";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: DataSourceMode;
  onChange: (mode: DataSourceMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Fonte de dados do dashboard"
      className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:w-auto"
    >
      {MODE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none lg:py-1.5",
            "focus-visible:ring-2 focus-visible:ring-ring/60",
            mode === option.value
              ? "bg-card text-primary ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MonthSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (month: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Mês exibido no dashboard">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((month) => (
          <SelectItem key={month} value={month}>
            {capitalize(monthLongLabel(month))}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="grid h-72 w-full place-items-center rounded-lg bg-muted/40 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function trendFromVariation(
  variation: number | null,
  positiveWhenUp: boolean,
): { direction: "up" | "down"; label: string; tone: "positive" | "negative" } | undefined {
  if (variation === null || variation === 0) return undefined;
  const up = variation > 0;
  return {
    direction: up ? "up" : "down",
    label: `${up ? "+" : ""}${variation}% vs. mês anterior`,
    tone: (up ? positiveWhenUp : !positiveWhenUp) ? "positive" : "negative",
  };
}

export function DashboardView() {
  const { transactions, status, mode, setMode, error, reload } =
    useTransactionsContext();
  const { bills: allBills } = useBillsContext();

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // A data atual só é lida após a hidratação (evita new Date() no prerender).
  const hydrated = useHydrated();

  // Ao trocar a fonte de dados, volta para o mês padrão da nova fonte.
  const [previousMode, setPreviousMode] = useState<DataSourceMode>(mode);
  if (previousMode !== mode) {
    setPreviousMode(mode);
    setSelectedMonth(null);
  }

  // Dados de demonstração ficam isolados dos lançamentos reais.
  const dataset = useMemo(
    () => (mode === "demo" ? demoTransactions : transactions),
    [mode, transactions],
  );

  const monthOptions = useMemo(() => {
    const months = new Set(dataset.map((transaction) => monthKeyOf(transaction.date)));
    if (hydrated) months.add(currentMonthKey());
    return [...months].sort().reverse();
  }, [dataset, hydrated]);

  const effectiveMonth =
    (selectedMonth && monthOptions.includes(selectedMonth) ? selectedMonth : monthOptions[0]) ??
    DEFAULT_MONTH;

  const monthTransactions = useMemo(
    () =>
      filterTransactions(dataset, {
        from: startOfMonthDate(effectiveMonth),
        to: endOfMonthDate(effectiveMonth),
      }),
    [dataset, effectiveMonth],
  );

  const previousMonthKey = shiftMonthKey(effectiveMonth, -1);
  const previousTransactions = useMemo(
    () =>
      filterTransactions(dataset, {
        from: startOfMonthDate(previousMonthKey),
        to: endOfMonthDate(previousMonthKey),
      }),
    [dataset, previousMonthKey],
  );

  const summary = useMemo(() => summarizeTransactions(monthTransactions), [monthTransactions]);
  const previousSummary = useMemo(
    () => summarizeTransactions(previousTransactions),
    [previousTransactions],
  );

  const series = useMemo(
    () => monthlyFlowSeries(dataset, effectiveMonth, 6),
    [dataset, effectiveMonth],
  );

  const seriesPoints = useMemo(
    () =>
      series.map((point) => ({
        mes: point.label,
        receitas: centsToReais(point.incomeCents),
        despesas: centsToReais(point.expenseCents),
      })),
    [series],
  );

  const categoryTotals = useMemo(
    () => expenseTotalsByCategory(monthTransactions),
    [monthTransactions],
  );

  const categoryPoints = useMemo(
    () =>
      categoryTotals.map((total) => ({
        nome: categoryLabel(total.categoryId),
        valor: centsToReais(total.amountCents),
      })),
    [categoryTotals],
  );

  const totalCategoriesCents = categoryTotals.reduce(
    (total, item) => total + item.amountCents,
    0,
  );

  const recentRows = useMemo<RecentTransactionRow[]>(
    () =>
      [...monthTransactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
        .map((transaction) => ({
          id: transaction.id,
          description: transaction.description,
          categoryLabel: categoryLabel(transaction.categoryId),
          accountLabel: accountLabel(transaction.accountId),
          date: transaction.date,
          amountCents: transaction.amountCents,
          type: transaction.type,
        })),
    [monthTransactions],
  );

  const hasData = dataset.length > 0;
  const isDemo = mode === "demo";

  // Datas só são lidas após a hidratação (evita new Date() no prerender).
  const today = hydrated ? todayISODate() : "1970-01";

  // "Próximas contas": dados de exemplo no modo demo; contas reais em aberto.
  const upcomingRows = useMemo<UpcomingBillRow[]>(() => {
    if (isDemo) return demoUpcomingBills;
    return billsDueSoon(allBills, today, 10).map((bill) => ({
      id: bill.id,
      descricao: bill.description,
      categoria: categoryLabel(bill.categoryId),
      vencimento: bill.dueDate,
      valor: centsToReais(bill.amountCents),
      status: effectiveBillStatus(bill, today) === "overdue" ? "pendente" : "agendada",
    }));
  }, [isDemo, allBills, today]);

  // Contas a pagar em aberto (pendentes + vencidas) para o cartão do resumo.
  const openPayables = useMemo(() => {
    const open = allBills.filter((bill) => bill.type === "payable" && bill.status === "pending");
    return {
      count: open.length,
      totalCents: open.reduce((total, bill) => total + bill.amountCents, 0),
    };
  }, [allBills]);

  const incomeTrend = trendFromVariation(
    variationPercent(summary.incomeCents, previousSummary.incomeCents),
    true,
  );
  const expenseTrend = trendFromVariation(
    variationPercent(summary.expenseCents, previousSummary.expenseCents),
    false,
  );

  if (!hydrated || status === "loading") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-xl xl:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardContent className="items-center gap-3 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Não foi possível carregar os dados</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {error ?? "Ocorreu um erro inesperado ao ler os lançamentos salvos."}
          </p>
          <Button type="button" variant="outline" onClick={reload}>
            <RefreshCw aria-hidden />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-2">
          {isDemo ? (
            <>
              <DemoBadge />
              <p className="text-sm text-muted-foreground">
                Resumo demonstrativo de maio a outubro de 2026. Estes números são fictícios e
                ficam separados dos seus lançamentos — alterne a fonte de dados a qualquer momento.
              </p>
            </>
          ) : (
            <>
              <Badge variant="secondary">Seus lançamentos</Badge>
              <p className="text-sm text-muted-foreground">
                Resumo calculado a partir das suas transações cadastradas. Os totais usam exatamente
                a mesma regra de cálculo da página de Transações.
              </p>
            </>
          )}
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <MonthSelect
            options={monthOptions}
            value={effectiveMonth}
            onChange={setSelectedMonth}
          />
          <ModeToggle mode={mode} onChange={setMode} />
          <AddTransactionButton className="w-full sm:w-auto" />
        </div>
      </div>

      <section aria-label="Resumo financeiro do mês" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Saldo do mês"
          amount={centsToReais(summary.netCents)}
          icon={Wallet}
          hint="Receitas menos despesas no mês selecionado"
        />
        <SummaryCard
          label="Receitas do mês"
          amount={centsToReais(summary.incomeCents)}
          icon={TrendingUp}
          tone="positive"
          trend={incomeTrend}
        />
        <SummaryCard
          label="Despesas do mês"
          amount={centsToReais(summary.expenseCents)}
          icon={TrendingDown}
          tone="negative"
          trend={expenseTrend}
        />
        {isDemo ? (
          <SummaryCard
            label="Contas pendentes"
            amount={demoSummary.contasPendentes.valorTotal}
            icon={ReceiptText}
            hint={`${demoSummary.contasPendentes.quantidade} contas aguardando pagamento`}
          />
        ) : (
          <SummaryCard
            label="Contas pendentes"
            amount={centsToReais(openPayables.totalCents)}
            icon={ReceiptText}
            hint={`${openPayables.count} ${openPayables.count === 1 ? "conta aguardando" : "contas aguardando"} pagamento`}
          />
        )}
      </section>

      <section aria-label="Gráficos financeiros" className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Receitas x despesas</CardTitle>
            <p className="text-xs text-muted-foreground">
              Comparativo dos últimos 6 meses
              {isDemo ? " · valores de exemplo" : " com base nos seus lançamentos"}
            </p>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <IncomeExpenseChart data={seriesPoints} />
            ) : (
              <EmptyChartPlaceholder message="Cadastre receitas e despesas para acompanhar a evolução mensal." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
            <p className="text-xs text-muted-foreground">
              Total de {formatCurrency(centsToReais(totalCategoriesCents))} em{" "}
              {monthLongLabel(effectiveMonth)}
            </p>
          </CardHeader>
          <CardContent>
            {categoryPoints.length > 0 ? (
              <CategoryExpenseChart data={categoryPoints} />
            ) : (
              <EmptyChartPlaceholder message="Nenhuma despesa registrada no mês selecionado." />
            )}
          </CardContent>
        </Card>
      </section>

      <section
        aria-label="Transações, contas próximas e metas"
        className="grid gap-4 xl:grid-cols-3 xl:items-start"
      >
        <div className="xl:col-span-2">
          <RecentTransactions
            rows={recentRows}
            subtitle={
              isDemo
                ? `Últimos lançamentos de ${monthLongLabel(effectiveMonth)} · dados de exemplo`
                : `Últimos lançamentos de ${monthLongLabel(effectiveMonth)}`
            }
            emptyMessage={
              isDemo
                ? "Nenhuma transação de exemplo neste mês."
                : "Nenhuma transação neste mês. Cadastre uma receita ou despesa para começar."
            }
          />
        </div>
        <div className="space-y-4">
          <UpcomingBills rows={upcomingRows} isDemo={isDemo} />
          <GoalProgress />
        </div>
      </section>
    </div>
  );
}
