"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { PayBillDialog } from "@/components/bills/pay-bill-dialog";
import { UnpayBillDialog } from "@/components/bills/unpay-bill-dialog";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { DebtsList } from "@/components/debts/debts-list";
import { DebtCloseDialog } from "@/components/debts/debt-close-dialog";
import { DebtDetailDialog } from "@/components/debts/debt-detail-dialog";
import { DebtFormDialog } from "@/components/debts/debt-form-dialog";
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
import { useDebts } from "@/hooks/use-debts";
import { useHydrated } from "@/hooks/use-sidebar-collapsed";
import type { Bill } from "@/lib/bills/types";
import { debtProgress, effectiveDebtStatus, summarizeDebts } from "@/lib/debts/finance";
import type { Debt } from "@/lib/debts/types";
import { categoryLabel } from "@/lib/transactions/categories";
import { todayISODate } from "@/lib/transactions/finance";
import { centsToReais } from "@/lib/transactions/money";

type StatusFilter = "all" | "active" | "settled" | "cancelled";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativas" },
  { value: "settled", label: "Quitadas" },
  { value: "cancelled", label: "Canceladas" },
] as const;

const ALL_CATEGORIES = "all-categories";

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "dívida" : "dívidas"}`;
}

export function DebtsView() {
  const { debts, status, error, reload } = useDebts();
  const { bills } = useBills();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [details, setDetails] = useState<Debt | null>(null);
  const [closing, setClosing] = useState<{ debt: Debt; kind: "settle" | "cancel" } | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);
  const [unpaying, setUnpaying] = useState<Bill | null>(null);

  // Datas só são lidas após a hidratação (evita new Date() no prerender).
  const hydrated = useHydrated();
  const today = hydrated ? todayISODate() : "1970-01-01";

  const categoryOptions = useMemo(() => {
    const ids = new Set(debts.map((debt) => debt.categoryId));
    return [...ids]
      .map((id) => ({ id, label: categoryLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [debts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return debts.filter((debt) => {
      if (term) {
        const haystack = `${debt.name} ${debt.creditor}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (categoryFilter && debt.categoryId !== categoryFilter) return false;
      if (statusFilter !== "all") {
        if (effectiveDebtStatus(debt, bills, today) !== statusFilter) return false;
      }
      return true;
    });
  }, [debts, bills, search, categoryFilter, statusFilter, today]);

  const summary = useMemo(() => summarizeDebts(debts, bills, today), [debts, bills, today]);
  const overdueTotal = useMemo(
    () =>
      debts
        .filter((debt) => effectiveDebtStatus(debt, bills, today) === "active")
        .reduce((total, debt) => total + debtProgress(debt, bills, today).overdueCount, 0),
    [debts, bills, today],
  );

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all" || categoryFilter !== "";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("");
  }

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  function openEdit(debt: Debt) {
    setEditing(debt);
    setFormKey((key) => key + 1);
    setFormOpen(true);
    setDetails(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <p className="text-sm text-muted-foreground">
            Cadastre o contrato da dívida uma vez — as parcelas pendentes viram contas a pagar
            automaticamente e alimentam seus lançamentos. Parcelas pagas antes do cadastro
            atualizam o progresso sem gerar transações fictícias.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HardDrive aria-hidden className="size-3.5 shrink-0" />
            Dívidas e parcelas salvas neste dispositivo (armazenamento provisório — o banco de
            dados chega em uma próxima etapa).
          </p>
        </div>
        <Button type="button" size="lg" className="w-full sm:w-auto" onClick={openCreate}>
          <Plus aria-hidden />
          Nova dívida
        </Button>
      </div>

      <section aria-label="Resumo das dívidas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Dívidas ativas"
          amount={centsToReais(summary.pendingCents)}
          icon={CalendarClock}
          hint={`${countLabel(summary.activeCount)} · saldo devedor`}
        />
        <SummaryCard
          label="Parcelas em aberto"
          amount={centsToReais(summary.pendingCents)}
          icon={AlertTriangle}
          tone="negative"
          hint={
            overdueTotal > 0
              ? `${overdueTotal} vencida(s) · ${summary.pendingInstallments} pendente(s) no total`
              : `${summary.pendingInstallments} parcela(s) pendente(s) no total`
          }
        />
        <SummaryCard
          label="Próximo vencimento"
          amount={summary.nextDue ? centsToReais(summary.nextDue.amountCents) : 0}
          icon={CheckCircle2}
          hint={
            summary.nextDue
              ? `${summary.nextDue.debtName} · ${summary.nextDue.dueDate.split("-").reverse().join("/")}`
              : "Nenhuma parcela em aberto"
          }
        />
      </section>

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="debts-search">Pesquisa</Label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="debts-search"
                placeholder="Buscar por nome ou credor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="debts-status">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger id="debts-status" className="w-full">
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
            <Label htmlFor="debts-category">Categoria</Label>
            <Select
              value={categoryFilter || ALL_CATEGORIES}
              onValueChange={(value) => setCategoryFilter(value === ALL_CATEGORIES ? "" : value)}
            >
              <SelectTrigger id="debts-category" className="w-full">
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

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X aria-hidden />
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">Dívidas</h2>
        <p className="text-xs text-muted-foreground">
          {status === "ready"
            ? `${countLabel(filtered.length)} de ${countLabel(debts.length)}`
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
              {error ?? "Ocorreu um erro inesperado ao ler as dívidas salvas."}
            </p>
            <Button type="button" variant="outline" onClick={reload}>
              <RefreshCw aria-hidden />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && debts.length === 0 && (
        <Card>
          <CardContent className="items-center gap-4 py-12 text-center sm:py-16">
            <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <CalendarClock aria-hidden className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Nenhuma dívida ainda</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Cadastre um financiamento, empréstimo ou compra parcelada. As parcelas pendentes
                entram automaticamente em Contas a pagar e você acompanha o saldo devedor aqui.
              </p>
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus aria-hidden />
              Cadastrar primeira dívida
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && debts.length > 0 && filtered.length === 0 && (
        <Card>
          <CardContent className="items-center gap-4 py-12 text-center">
            <p className="text-base font-semibold text-foreground">Nenhuma dívida encontrada</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Nenhuma dívida corresponde aos filtros selecionados. Ajuste a pesquisa, o status ou a
              categoria.
            </p>
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X aria-hidden />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "ready" && filtered.length > 0 && (
        <DebtsList
          debts={filtered}
          onDetails={setDetails}
          onEdit={openEdit}
        />
      )}

      <DebtFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        debt={editing}
      />
      <DebtDetailDialog
        debt={details}
        onOpenChange={(open) => !open && setDetails(null)}
        onEdit={openEdit}
        onSettleEarly={(debt) => {
          setDetails(null);
          setClosing({ debt, kind: "settle" });
        }}
        onCancel={(debt) => {
          setDetails(null);
          setClosing({ debt, kind: "cancel" });
        }}
        onPayBill={setPaying}
        onUnpayBill={setUnpaying}
      />
      <DebtCloseDialog
        debt={closing?.debt ?? null}
        kind={closing?.kind ?? "settle"}
        onOpenChange={(open) => !open && setClosing(null)}
      />
      <PayBillDialog
        bill={paying}
        type="payable"
        onOpenChange={(open) => !open && setPaying(null)}
      />
      <UnpayBillDialog
        bill={unpaying}
        type="payable"
        onOpenChange={(open) => !open && setUnpaying(null)}
      />
    </div>
  );
}
