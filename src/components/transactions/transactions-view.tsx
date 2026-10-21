"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionDetailDialog } from "@/components/transactions/transaction-detail-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { useTransactionCategories, useTransactions } from "@/hooks/use-transactions";
import { useHydrated } from "@/hooks/use-sidebar-collapsed";
import {
  currentMonthKey,
  filterTransactions,
  resolvePeriod,
  summarizeTransactions,
  type PeriodPreset,
} from "@/lib/transactions/finance";
import { centsToReais } from "@/lib/transactions/money";
import type { Transaction, TransactionType } from "@/lib/transactions/types";

const TYPE_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
] as const;

const PERIOD_OPTIONS = [
  { value: "current-month", label: "Mês atual" },
  { value: "previous-month", label: "Mês anterior" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "custom", label: "Período personalizado" },
  { value: "all", label: "Todo o período" },
] as const;

const ALL_CATEGORIES = "all-categories";

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "lançamento" : "lançamentos"}`;
}

export function TransactionsView() {
  const { transactions, status, error, reload, persistent } = useTransactions();
  const categories = useTransactionCategories();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("current-month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  // A data atual só é lida após a hidratação (evita new Date() no prerender).
  const hydrated = useHydrated();
  const referenceMonth = hydrated ? currentMonthKey() : "1970-01";

  const period = useMemo(
    () => resolvePeriod(periodPreset, referenceMonth, { from: customFrom, to: customTo }),
    [periodPreset, referenceMonth, customFrom, customTo],
  );

  const filtered = useMemo(
    () =>
      filterTransactions(transactions, {
        search,
        type: typeFilter,
        categoryId: categoryFilter || undefined,
        from: period.from,
        to: period.to,
      }),
    [transactions, search, typeFilter, categoryFilter, period],
  );

  const summary = useMemo(() => summarizeTransactions(filtered), [filtered]);

  const categoryOptions = useMemo(
    () =>
      typeFilter === "all"
        ? categories
        : categories.filter((category) => category.type === typeFilter),
    [categories, typeFilter],
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "" ||
    periodPreset !== "current-month";

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("");
    setPeriodPreset("current-month");
    setCustomFrom("");
    setCustomTo("");
  }

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <p className="text-sm text-muted-foreground">
            Todas as suas receitas e despesas em um só lugar. Use os filtros para acompanhar o
            período que interessar — os totais são recalculados com os mesmos critérios da lista.
          </p>
          <p
            className={
              persistent
                ? "flex items-center gap-1.5 text-xs text-muted-foreground"
                : "flex items-center gap-1.5 text-xs text-destructive"
            }
          >
            <HardDrive aria-hidden className="size-3.5 shrink-0" />
            {persistent
              ? "Lançamentos salvos neste dispositivo (armazenamento provisório — o banco de dados chega em uma próxima etapa)."
              : "O armazenamento do navegador está indisponível: os dados serão perdidos ao fechar a página."}
          </p>
        </div>
        <Button type="button" size="lg" className="w-full sm:w-auto" onClick={openCreate}>
          <Plus aria-hidden />
          Nova transação
        </Button>
      </div>

      <section aria-label="Resumo do período" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Receitas do período"
          amount={centsToReais(summary.incomeCents)}
          icon={TrendingUp}
          tone="positive"
          hint={countLabel(summary.incomeCount)}
        />
        <SummaryCard
          label="Despesas do período"
          amount={centsToReais(summary.expenseCents)}
          icon={TrendingDown}
          tone="negative"
          hint={countLabel(summary.expenseCount)}
        />
        <SummaryCard
          label="Saldo do período"
          amount={centsToReais(summary.netCents)}
          icon={Wallet}
          hint="Receitas menos despesas no período filtrado"
        />
      </section>

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="transactions-search">Pesquisa</Label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="transactions-search"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transactions-type">Tipo</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as "all" | TransactionType);
                setCategoryFilter("");
              }}
            >
              <SelectTrigger id="transactions-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transactions-category">Categoria</Label>
            <Select
              value={categoryFilter || ALL_CATEGORIES}
              onValueChange={(value) => setCategoryFilter(value === ALL_CATEGORIES ? "" : value)}
            >
              <SelectTrigger id="transactions-category" className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transactions-period">Período</Label>
            <Select
              value={periodPreset}
              onValueChange={(value) => setPeriodPreset(value as PeriodPreset)}
            >
              <SelectTrigger id="transactions-period" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periodPreset === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
              <div className="grid gap-2">
                <Label htmlFor="transactions-from">De</Label>
                <Input
                  id="transactions-from"
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transactions-to">Até</Label>
                <Input
                  id="transactions-to"
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={clearFilters}>
                <X aria-hidden />
                Limpar filtros
              </Button>
            </div>
          )}

          {periodPreset !== "custom" && hasActiveFilters && (
            <div className="flex items-end xl:col-span-4">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X aria-hidden />
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">Lançamentos</h2>
        <p className="text-xs text-muted-foreground">
          {status === "ready" ? `${countLabel(filtered.length)} de ${countLabel(transactions.length)}` : "Carregando..."}
        </p>
      </div>

      {status === "loading" && (
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {status === "error" && (
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
      )}

      {status === "ready" && transactions.length === 0 && (
        <Card>
          <CardContent className="items-center gap-4 py-12 text-center sm:py-16">
            <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <ArrowRightLeft aria-hidden className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Nenhuma transação ainda</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Cadastre sua primeira receita ou despesa para começar a acompanhar suas finanças.
                Os resumos e gráficos do dashboard são atualizados automaticamente.
              </p>
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus aria-hidden />
              Cadastrar primeira transação
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && transactions.length > 0 && filtered.length === 0 && (
        <Card>
          <CardContent className="items-center gap-4 py-12 text-center">
            <p className="text-base font-semibold text-foreground">Nenhuma transação encontrada</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Nenhum lançamento corresponde aos filtros selecionados. Ajuste a pesquisa, o tipo, a
              categoria ou o período.
            </p>
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X aria-hidden />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && filtered.length > 0 && (
        <TransactionList
          transactions={filtered}
          onView={setViewing}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}

      <TransactionFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
      />
      <TransactionDetailDialog
        transaction={viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
      <DeleteTransactionDialog
        transaction={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
