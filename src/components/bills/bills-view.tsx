"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";
import { BillFormDialog } from "@/components/bills/bill-form-dialog";
import { BillsList } from "@/components/bills/bills-list";
import { DeleteBillDialog } from "@/components/bills/delete-bill-dialog";
import { PayBillDialog } from "@/components/bills/pay-bill-dialog";
import { UnpayBillDialog } from "@/components/bills/unpay-bill-dialog";
import { SummaryCard } from "@/components/dashboard/summary-card";
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
import { useBills } from "@/hooks/use-bills";
import { useTransactionCategories } from "@/hooks/use-transactions";
import { useHydrated } from "@/hooks/use-sidebar-collapsed";
import {
  filterBills,
  sortBillsForList,
  summarizeBills,
  monthOptionsForBills,
  type BillStatusFilter,
} from "@/lib/bills/finance";
import type { Bill, BillType } from "@/lib/bills/types";
import {
  currentMonthKey,
  endOfMonthDate,
  monthLongLabel,
  startOfMonthDate,
  todayISODate,
} from "@/lib/transactions/finance";
import { centsToReais } from "@/lib/transactions/money";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "pending", label: "Pendentes" },
  { value: "overdue", label: "Vencidas" },
  { value: "paid", label: "Quitadas" },
] as const;

const ALL_CATEGORIES = "all-categories";
const ALL_MONTHS = "all-months";

const TYPE_COPY = {
  payable: {
    title: "Contas a pagar",
    description:
      "Acompanhe boletos, contas fixas e vencimentos para nada escapar. A baixa cria um lançamento de despesa automaticamente.",
    emptyTitle: "Nenhuma conta a pagar ainda",
    emptyDescription:
      "Cadastre seu primeiro boleto ou conta fixa com vencimento. Marcar como paga gera o lançamento na página de Transações.",
    createLabel: "Nova conta a pagar",
    firstLabel: "Cadastrar primeira conta",
    openLabel: "A pagar em aberto",
    overdueLabel: "Vencidas",
    paidLabel: "Pagas no filtro",
  },
  receivable: {
    title: "Contas a receber",
    description:
      "Organize salários, freelas e outros recebimentos previstos. A baixa cria um lançamento de receita automaticamente.",
    emptyTitle: "Nenhuma conta a receber ainda",
    emptyDescription:
      "Cadastre um recebimento com data prevista. Marcar como recebida gera o lançamento na página de Transações.",
    createLabel: "Nova conta a receber",
    firstLabel: "Cadastrar primeira conta",
    openLabel: "A receber em aberto",
    overdueLabel: "Em atraso",
    paidLabel: "Recebidas no filtro",
  },
} as const;

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "conta" : "contas"}`;
}

export function BillsView({ type }: { type: BillType }) {
  const { bills, status, error, reload, persistent } = useBills();
  const categories = useTransactionCategories();
  const copy = TYPE_COPY[type];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>(ALL_MONTHS);

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [unpaying, setUnpaying] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState<Bill | null>(null);

  // Datas só são lidas após a hidratação (evita new Date() no prerender).
  const hydrated = useHydrated();
  const today = hydrated ? todayISODate() : "1970-01";
  const referenceMonth = hydrated ? currentMonthKey() : "1970-01";

  const billsOfThisType = useMemo(
    () => bills.filter((bill) => bill.type === type),
    [bills, type],
  );

  const monthOptions = useMemo(
    () => monthOptionsForBills(billsOfThisType, referenceMonth),
    [billsOfThisType, referenceMonth],
  );

  const monthRange = useMemo(() => {
    if (monthFilter === ALL_MONTHS) return {};
    return { from: startOfMonthDate(monthFilter), to: endOfMonthDate(monthFilter) };
  }, [monthFilter]);

  const filtered = useMemo(
    () =>
      sortBillsForList(
        filterBills(
          billsOfThisType,
          {
            search,
            status: statusFilter,
            categoryId: categoryFilter || undefined,
            from: monthRange.from,
            to: monthRange.to,
          },
          today,
        ),
        today,
      ),
    [billsOfThisType, search, statusFilter, categoryFilter, monthRange, today],
  );

  const summary = useMemo(() => summarizeBills(filtered, today), [filtered, today]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "" ||
    monthFilter !== ALL_MONTHS;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("");
    setMonthFilter(ALL_MONTHS);
  }

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  function openEdit(bill: Bill) {
    setEditing(bill);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <p className="text-sm text-muted-foreground">{copy.description}</p>
          <p
            className={
              persistent
                ? "flex items-center gap-1.5 text-xs text-muted-foreground"
                : "flex items-center gap-1.5 text-xs text-destructive"
            }
          >
            <HardDrive aria-hidden className="size-3.5 shrink-0" />
            {persistent
              ? "Contas salvas neste dispositivo (armazenamento provisório — o banco de dados chega em uma próxima etapa)."
              : "O armazenamento do navegador está indisponível: os dados serão perdidos ao fechar a página."}
          </p>
        </div>
        <Button type="button" size="lg" className="w-full sm:w-auto" onClick={openCreate}>
          <Plus aria-hidden />
          {copy.createLabel}
        </Button>
      </div>

      <section aria-label="Resumo das contas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label={copy.openLabel}
          amount={centsToReais(summary.openCents)}
          icon={CalendarClock}
          hint={countLabel(summary.openCount)}
        />
        <SummaryCard
          label={copy.overdueLabel}
          amount={centsToReais(summary.overdueCents)}
          icon={AlertTriangle}
          tone="negative"
          hint={countLabel(summary.overdueCount)}
        />
        <SummaryCard
          label={copy.paidLabel}
          amount={centsToReais(summary.paidCents)}
          icon={CheckCircle2}
          hint={countLabel(summary.paidCount)}
        />
      </section>

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="bills-search">Pesquisa</Label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="bills-search"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bills-status">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as BillStatusFilter)}
            >
              <SelectTrigger id="bills-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bills-category">Categoria</Label>
            <Select
              value={categoryFilter || ALL_CATEGORIES}
              onValueChange={(value) => setCategoryFilter(value === ALL_CATEGORIES ? "" : value)}
            >
              <SelectTrigger id="bills-category" className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bills-month">Mês de vencimento</Label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger id="bills-month" className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value={ALL_MONTHS}>Todos os meses</SelectItem>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {monthLongLabel(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
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
        <h2 className="text-sm font-medium text-foreground">Contas</h2>
        <p className="text-xs text-muted-foreground">
          {status === "ready"
            ? `${countLabel(filtered.length)} de ${countLabel(billsOfThisType.length)}`
            : "Carregando..."}
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
              {error ?? "Ocorreu um erro inesperado ao ler as contas salvas."}
            </p>
            <Button type="button" variant="outline" onClick={reload}>
              <RefreshCw aria-hidden />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && billsOfThisType.length === 0 && (
        <Card>
          <CardContent className="items-center gap-4 py-12 text-center sm:py-16">
            <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <CalendarClock aria-hidden className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{copy.emptyTitle}</p>
              <p className="max-w-md text-sm text-muted-foreground">{copy.emptyDescription}</p>
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus aria-hidden />
              {copy.firstLabel}
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && billsOfThisType.length > 0 && filtered.length === 0 && (
        <Card>
          <CardContent className="items-center gap-4 py-12 text-center">
            <p className="text-base font-semibold text-foreground">Nenhuma conta encontrada</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Nenhuma conta corresponde aos filtros selecionados. Ajuste a pesquisa, o status, a
              categoria ou o mês.
            </p>
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X aria-hidden />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && filtered.length > 0 && (
        <BillsList
          bills={filtered}
          today={today}
          type={type}
          onPay={setPaying}
          onEdit={openEdit}
          onUnpay={setUnpaying}
          onDelete={setDeleting}
        />
      )}

      <BillFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        type={type}
        bill={editing}
      />
      <PayBillDialog bill={paying} type={type} onOpenChange={(open) => !open && setPaying(null)} />
      <UnpayBillDialog
        bill={unpaying}
        type={type}
        onOpenChange={(open) => !open && setUnpaying(null)}
      />
      <DeleteBillDialog
        bill={deleting}
        type={type}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
