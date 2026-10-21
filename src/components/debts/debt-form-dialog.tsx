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
import { useDebts } from "@/hooks/use-debts";
import { MAX_DEBT_INSTALLMENTS } from "@/lib/bills/local-repository";
import { dueDayOf, previewDebtSchedule } from "@/lib/debts/finance";
import type { Debt, DebtDraft } from "@/lib/debts/types";
import { defaultAccounts } from "@/lib/transactions/accounts";
import { expenseCategories } from "@/lib/transactions/categories";
import { isValidISODate, todayISODate } from "@/lib/transactions/finance";
import { centsToReais, formatCents, parseAmountToCents } from "@/lib/transactions/money";
import { formatDate, formatCurrency } from "@/lib/format";

type FormState = {
  name: string;
  creditor: string;
  totalOriginal: string;
  installmentAmount: string;
  totalInstallments: string;
  initialPaid: string;
  firstPendingDueDate: string;
  categoryId: string;
  accountId: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const FORM_ID = "debt-form";

function defaultDueDate(): string {
  if (typeof window === "undefined") return "";
  return todayISODate();
}

function buildInitialState(debt?: Debt | null): FormState {
  return {
    name: debt?.name ?? "",
    creditor: debt?.creditor ?? "",
    totalOriginal: debt?.totalOriginalCents ? formatCents(debt.totalOriginalCents) : "",
    installmentAmount: debt ? formatCents(debt.installmentCents) : "",
    totalInstallments: debt ? String(debt.totalInstallments) : "",
    initialPaid: debt ? String(debt.initialPaidInstallments) : "0",
    firstPendingDueDate: debt?.firstPendingDueDate ?? defaultDueDate(),
    categoryId: debt?.categoryId ?? "",
    accountId: debt?.accountId ?? defaultAccounts[0].id,
    notes: debt?.notes ?? "",
  };
}

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!state.name.trim()) errors.name = "Informe o nome da dívida.";
  if (!state.creditor.trim()) errors.creditor = "Informe o credor ou instituição.";

  const installmentCents = parseAmountToCents(state.installmentAmount);
  if (installmentCents === null) {
    errors.installmentAmount = "Informe um valor válido, ex.: 250,00.";
  } else if (installmentCents <= 0) {
    errors.installmentAmount = "O valor da parcela deve ser maior que zero.";
  }

  const total = Number(state.totalInstallments);
  if (!state.totalInstallments || !Number.isInteger(total) || total < 1) {
    errors.totalInstallments = "Informe a quantidade total de parcelas.";
  } else if (total > MAX_DEBT_INSTALLMENTS) {
    errors.totalInstallments = `O limite é de ${MAX_DEBT_INSTALLMENTS} parcelas.`;
  }

  const initialPaid = Number(state.initialPaid);
  if (state.initialPaid === "" || !Number.isInteger(initialPaid) || initialPaid < 0) {
    errors.initialPaid = "Informe um número válido de parcelas já pagas.";
  } else if (total >= 1 && initialPaid >= total) {
    errors.initialPaid = "Deixe ao menos uma parcela pendente (menor que o total).";
  }

  if (!state.firstPendingDueDate || !isValidISODate(state.firstPendingDueDate)) {
    errors.firstPendingDueDate = "Informe o primeiro vencimento pendente.";
  }

  if (!state.categoryId) errors.categoryId = "Selecione a categoria.";
  if (!state.accountId) errors.accountId = "Selecione a conta financeira.";

  if (state.totalOriginal.trim()) {
    const totalOriginalCents = parseAmountToCents(state.totalOriginal);
    if (totalOriginalCents === null || totalOriginalCents <= 0) {
      errors.totalOriginal = "Valor total inválido (deixe em branco se desconhecido).";
    }
  }

  return errors;
}

type DebtFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Informado no modo edição; ausente para criar. */
  debt?: Debt | null;
};

export function DebtFormDialog({ open, onOpenChange, debt }: DebtFormDialogProps) {
  const { create, update } = useDebts();
  const [state, setState] = useState<FormState>(() => buildInitialState(debt));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(debt);
  // Categorias de despesa: dívidas são compromissos de saída.
  const categories = expenseCategories;

  const installmentCents = parseAmountToCents(state.installmentAmount);
  const total = Number(state.totalInstallments);
  const initialPaid = Number(state.initialPaid);
  const canPreview =
    installmentCents !== null &&
    installmentCents > 0 &&
    Number.isInteger(total) &&
    total >= 1 &&
    Number.isInteger(initialPaid) &&
    initialPaid >= 0 &&
    initialPaid < total &&
    isValidISODate(state.firstPendingDueDate);

  const preview = canPreview
    ? previewDebtSchedule({
        installmentCents,
        totalInstallments: total,
        initialPaidInstallments: initialPaid,
        firstPendingDueDate: state.firstPendingDueDate,
      })
    : null;

  const totalOriginalCents = state.totalOriginal.trim()
    ? parseAmountToCents(state.totalOriginal)
    : null;
  const originalDelta =
    totalOriginalCents !== null && preview
      ? totalOriginalCents - preview.contractTotalCents
      : null;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleBlur(key: "installmentAmount" | "totalOriginal") {
    const cents = parseAmountToCents(state[key]);
    if (cents !== null && cents > 0) {
      setState((current) => ({ ...current, [key]: formatCents(cents) }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return; // evita envios duplicados durante o processamento

    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const draft: DebtDraft = {
      name: state.name.trim(),
      creditor: state.creditor.trim(),
      totalOriginalCents:
        state.totalOriginal.trim() && totalOriginalCents !== null ? totalOriginalCents : null,
      installmentCents: installmentCents!,
      totalInstallments: total,
      initialPaidInstallments: initialPaid,
      firstPendingDueDate: state.firstPendingDueDate,
      categoryId: state.categoryId,
      accountId: state.accountId,
      notes: state.notes.trim() || undefined,
    };

    setIsSaving(true);
    setSubmitError(null);
    try {
      if (isEditing) {
        await update(debt!.id, draft);
      } else {
        await create(draft);
      }
      onOpenChange(false);
    } catch {
      setSubmitError(
        isEditing
          ? "Não foi possível salvar as alterações. Tente novamente."
          : "Não foi possível salvar a dívida. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar dívida" : "Nova dívida"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Parcelas já pagas são preservadas; apenas as pendentes serão reprogramadas."
              : "Cadastre o contrato uma vez — as parcelas pendentes viram contas a pagar automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="debt-name">Nome da dívida</Label>
              <Input
                id="debt-name"
                placeholder="Ex.: Notebook Nubank"
                value={state.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                disabled={isSaving}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-creditor">Credor / instituição</Label>
              <Input
                id="debt-creditor"
                placeholder="Ex.: Nubank"
                value={state.creditor}
                onChange={(event) => updateField("creditor", event.target.value)}
                aria-invalid={Boolean(errors.creditor)}
                disabled={isSaving}
              />
              {errors.creditor && <p className="text-xs text-destructive">{errors.creditor}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="debt-installment">Valor da parcela</Label>
              <Input
                id="debt-installment"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={state.installmentAmount}
                onChange={(event) => updateField("installmentAmount", event.target.value)}
                onBlur={() => handleBlur("installmentAmount")}
                aria-invalid={Boolean(errors.installmentAmount)}
                disabled={isSaving}
              />
              {errors.installmentAmount && (
                <p className="text-xs text-destructive">{errors.installmentAmount}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-total-installments">Total de parcelas</Label>
              <Input
                id="debt-total-installments"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DEBT_INSTALLMENTS}
                value={state.totalInstallments}
                onChange={(event) => updateField("totalInstallments", event.target.value)}
                aria-invalid={Boolean(errors.totalInstallments)}
                disabled={isSaving}
              />
              {errors.totalInstallments && (
                <p className="text-xs text-destructive">{errors.totalInstallments}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="debt-initial-paid">Parcelas já pagas</Label>
              <Input
                id="debt-initial-paid"
                type="number"
                inputMode="numeric"
                min={0}
                value={state.initialPaid}
                onChange={(event) => updateField("initialPaid", event.target.value)}
                aria-invalid={Boolean(errors.initialPaid)}
                disabled={isSaving}
              />
              {errors.initialPaid && (
                <p className="text-xs text-destructive">{errors.initialPaid}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Contrato em andamento? Informe quanto já foi pago.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-first-due">Primeiro vencimento pendente</Label>
              <Input
                id="debt-first-due"
                type="date"
                value={state.firstPendingDueDate}
                onChange={(event) => updateField("firstPendingDueDate", event.target.value)}
                aria-invalid={Boolean(errors.firstPendingDueDate)}
                disabled={isSaving}
              />
              {errors.firstPendingDueDate && (
                <p className="text-xs text-destructive">{errors.firstPendingDueDate}</p>
              )}
              {preview && (
                <p className="text-xs text-muted-foreground">
                  Dia habitual de vencimento: dia {dueDayOf(state.firstPendingDueDate)} · mensal
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="debt-category">Categoria</Label>
              <Select
                value={state.categoryId || undefined}
                onValueChange={(value) => updateField("categoryId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="debt-category"
                  className="w-full"
                  aria-invalid={Boolean(errors.categoryId)}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-account">Conta financeira</Label>
              <Select
                value={state.accountId}
                onValueChange={(value) => updateField("accountId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="debt-account"
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
            <Label htmlFor="debt-total-original">
              Valor total original (opcional, quando conhecido)
            </Label>
            <Input
              id="debt-total-original"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={state.totalOriginal}
              onChange={(event) => updateField("totalOriginal", event.target.value)}
              onBlur={() => handleBlur("totalOriginal")}
              aria-invalid={Boolean(errors.totalOriginal)}
              disabled={isSaving}
            />
            {errors.totalOriginal && (
              <p className="text-xs text-destructive">{errors.totalOriginal}</p>
            )}
          </div>

          {preview && (
            <div className="grid gap-1.5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Cronograma previsto</p>
              <p>
                {formatCurrency(centsToReais(preview.remainingCents))} em{" "}
                {preview.remainingInstallments}{" "}
                {preview.remainingInstallments === 1 ? "parcela" : "parcelas"} · quitação prevista
                em {formatDate(preview.lastDueDate)}
              </p>
              {originalDelta !== null && originalDelta !== 0 && (
                <p>
                  Ajuste: soma das parcelas difere do total original em{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(Math.abs(centsToReais(originalDelta)))}
                  </span>{" "}
                  ({originalDelta > 0 ? "parcelas somam a menos" : "parcelas somam a mais"}).
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="debt-notes">Observações (opcional)</Label>
            <Textarea
              id="debt-notes"
              placeholder="Algum detalhe sobre a negociação"
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
            {isEditing
              ? "Pagamentos preservados · pendentes reprogramadas"
              : "Parcelas geradas como contas a pagar"}
          </p>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" form={FORM_ID} disabled={isSaving}>
              {isSaving ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />}
              {isSaving
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Criar dívida"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
