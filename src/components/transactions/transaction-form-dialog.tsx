"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTransactionCategories, useTransactions } from "@/hooks/use-transactions";
import { defaultAccounts, defaultPaymentMethods } from "@/lib/transactions/accounts";
import { categoriesForType } from "@/lib/transactions/categories";
import { isValidISODate, todayISODate } from "@/lib/transactions/finance";
import { formatCents, parseAmountToCents } from "@/lib/transactions/money";
import type { Transaction, TransactionDraft, TransactionType } from "@/lib/transactions/types";
import { cn } from "cn";

type FormState = {
  type: TransactionType;
  description: string;
  amount: string;
  categoryId: string;
  date: string;
  accountId: string;
  paymentMethodId: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const FORM_ID = "transaction-form";

/**
 * Data padrão do formulário. No render do servidor (prerender) não lemos o
 * relógio: o campo fica vazio e recebe a data atual quando o diálogo abre.
 */
function defaultDate(): string {
  if (typeof window === "undefined") return "";
  return todayISODate();
}

function buildInitialState(transaction?: Transaction | null): FormState {
  return {
    type: transaction?.type ?? "expense",
    description: transaction?.description ?? "",
    amount: transaction ? formatCents(transaction.amountCents) : "",
    categoryId: transaction?.categoryId ?? "",
    date: transaction?.date ?? defaultDate(),
    accountId: transaction?.accountId ?? defaultAccounts[0].id,
    paymentMethodId: transaction?.paymentMethodId ?? defaultPaymentMethods[0].id,
    notes: transaction?.notes ?? "",
  };
}

function validate(state: FormState, allowedCategoryIds: string[]): FormErrors {
  const errors: FormErrors = {};

  if (!state.description.trim()) {
    errors.description = "Informe uma descrição.";
  }

  const cents = parseAmountToCents(state.amount);
  if (cents === null) {
    errors.amount = "Informe um valor válido, ex.: 125,90.";
  } else if (cents <= 0) {
    errors.amount = "O valor deve ser maior que zero.";
  }

  if (!state.categoryId) {
    errors.categoryId = "Selecione uma categoria.";
  } else if (!allowedCategoryIds.includes(state.categoryId)) {
    errors.categoryId = "Selecione uma categoria compatível com o tipo.";
  }

  if (!state.date || !isValidISODate(state.date)) {
    errors.date = "Informe uma data válida.";
  }

  if (!state.accountId) {
    errors.accountId = "Selecione a conta financeira.";
  }

  if (!state.paymentMethodId) {
    errors.paymentMethodId = "Selecione a forma de pagamento.";
  }

  return errors;
}

type TransactionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Informado no modo edição; ausente para criar uma nova transação. */
  transaction?: Transaction | null;
  onSaved?: (transaction: Transaction) => void;
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: TransactionFormDialogProps) {
  const { create, update } = useTransactions();
  const allCategories = useTransactionCategories();

  const [state, setState] = useState<FormState>(() => buildInitialState(transaction));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(transaction);
  const typeCategories = categoriesForType(state.type, allCategories);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleTypeChange(type: TransactionType) {
    setState((current) => {
      const stillValid =
        current.categoryId &&
        categoriesForType(type, allCategories).some((item) => item.id === current.categoryId);
      return { ...current, type, categoryId: stillValid ? current.categoryId : "" };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next.categoryId;
      return next;
    });
  }

  function handleAmountBlur() {
    const cents = parseAmountToCents(state.amount);
    if (cents !== null && cents > 0) {
      setState((current) => ({ ...current, amount: formatCents(cents) }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return; // evita envios duplicados durante o processamento

    const nextErrors = validate(state, typeCategories.map((item) => item.id));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cents = parseAmountToCents(state.amount);
    if (cents === null || cents <= 0) return;

    const draft: TransactionDraft = {
      type: state.type,
      description: state.description.trim(),
      amountCents: cents,
      categoryId: state.categoryId,
      date: state.date,
      accountId: state.accountId,
      paymentMethodId: state.paymentMethodId,
      notes: state.notes.trim() || undefined,
    };

    setIsSaving(true);
    setSubmitError(null);
    try {
      const saved = isEditing
        ? await update(transaction!.id, draft)
        : await create(draft);
      onSaved?.(saved);
      onOpenChange(false);
    } catch {
      setSubmitError("Não foi possível salvar a transação. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados abaixo. Os cálculos do dashboard são recalculados na hora."
              : "Registre uma receita ou despesa. O lançamento fica salvo neste dispositivo."}
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-2">
            <Label id="transaction-type-label">Tipo de transação</Label>
            <div
              role="group"
              aria-labelledby="transaction-type-label"
              className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1"
            >
              {(
                [
                  { value: "income", label: "Receita" },
                  { value: "expense", label: "Despesa" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={state.type === option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring/60",
                    state.type === option.value
                      ? "bg-card text-primary ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="transaction-amount">Valor</Label>
              <Input
                id="transaction-amount"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={state.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                onBlur={handleAmountBlur}
                aria-invalid={Boolean(errors.amount)}
                disabled={isSaving}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transaction-date">Data</Label>
              <Input
                id="transaction-date"
                type="date"
                value={state.date}
                onChange={(event) => updateField("date", event.target.value)}
                aria-invalid={Boolean(errors.date)}
                disabled={isSaving}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction-description">Descrição</Label>
            <Input
              id="transaction-description"
              placeholder="Ex.: Supermercado"
              value={state.description}
              onChange={(event) => updateField("description", event.target.value)}
              aria-invalid={Boolean(errors.description)}
              disabled={isSaving}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="transaction-category">Categoria</Label>
              <Select
                value={state.categoryId || undefined}
                onValueChange={(value) => updateField("categoryId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="transaction-category"
                  className="w-full"
                  aria-invalid={Boolean(errors.categoryId)}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {typeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction-account">Conta financeira</Label>
              <Select
                value={state.accountId}
                onValueChange={(value) => updateField("accountId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="transaction-account"
                  className="w-full"
                  aria-invalid={Boolean(errors.accountId)}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {defaultAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && <p className="text-xs text-destructive">{errors.accountId}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction-payment">Forma de pagamento</Label>
            <Select
              value={state.paymentMethodId}
              onValueChange={(value) => updateField("paymentMethodId", value)}
              disabled={isSaving}
            >
              <SelectTrigger
                id="transaction-payment"
                className="w-full sm:max-w-64"
                aria-invalid={Boolean(errors.paymentMethodId)}
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {defaultPaymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethodId && (
              <p className="text-xs text-destructive">{errors.paymentMethodId}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction-notes">Observações (opcional)</Label>
            <Textarea
              id="transaction-notes"
              placeholder="Algum detalhe importante sobre este lançamento"
              value={state.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              disabled={isSaving}
            />
          </div>

          {submitError && (
            <p role="alert" className="text-xs text-destructive">
              {submitError}
            </p>
          )}
        </form>

        <DialogFooter className="gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Valores em reais · salvos neste dispositivo
          </p>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" form={FORM_ID} disabled={isSaving}>
              {isSaving ? (
                <Loader2 aria-hidden className="animate-spin" />
              ) : (
                <Check aria-hidden />
              )}
              {isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar transação"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
