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
import { useBills } from "@/hooks/use-bills";
import { useTransactionCategories } from "@/hooks/use-transactions";
import { MAX_INSTALLMENTS } from "@/lib/bills/local-repository";
import { planInstallments } from "@/lib/bills/finance";
import type { Bill, BillDraft, BillType, BillUpdateDraft } from "@/lib/bills/types";
import { defaultAccounts } from "@/lib/transactions/accounts";
import { categoriesForType } from "@/lib/transactions/categories";
import { isValidISODate, todayISODate } from "@/lib/transactions/finance";
import { centsToReais, formatCents, parseAmountToCents } from "@/lib/transactions/money";
import { formatDate, formatCurrency } from "@/lib/format";

type FormState = {
  amount: string;
  dueDate: string;
  description: string;
  categoryId: string;
  accountId: string;
  totalInstallments: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const FORM_ID = "bill-form";

/**
 * Data padrão do formulário. No render do servidor (prerender) não lemos o
 * relógio: o campo fica vazio e recebe a data atual quando o diálogo abre.
 */
function defaultDueDate(): string {
  if (typeof window === "undefined") return "";
  return todayISODate();
}

function buildInitialState(bill?: Bill | null): FormState {
  return {
    amount: bill ? formatCents(bill.amountCents) : "",
    dueDate: bill?.dueDate ?? defaultDueDate(),
    description: bill?.description ?? "",
    categoryId: bill?.categoryId ?? "",
    accountId: bill?.accountId ?? defaultAccounts[0].id,
    totalInstallments: bill ? String(bill.totalInstallments) : "1",
    notes: bill?.notes ?? "",
  };
}

function validate(state: FormState, allowedCategoryIds: string[], isEditing: boolean): FormErrors {
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

  if (!state.dueDate || !isValidISODate(state.dueDate)) {
    errors.dueDate = "Informe um vencimento válido.";
  }

  if (!state.accountId) {
    errors.accountId = "Selecione a conta financeira.";
  }

  if (!isEditing) {
    const installments = Number(state.totalInstallments);
    if (
      !Number.isInteger(installments) ||
      installments < 1 ||
      installments > MAX_INSTALLMENTS
    ) {
      errors.totalInstallments = `Use um número inteiro entre 1 e ${MAX_INSTALLMENTS}.`;
    }
  }

  return errors;
}

type BillFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: BillType;
  /** Informado no modo edição; ausente para criar uma nova conta. */
  bill?: Bill | null;
  onSaved?: (bills: Bill[]) => void;
};

export function BillFormDialog({
  open,
  onOpenChange,
  type,
  bill,
  onSaved,
}: BillFormDialogProps) {
  const { create, update } = useBills();
  const allCategories = useTransactionCategories();

  const [state, setState] = useState<FormState>(() => buildInitialState(bill));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(bill);
  const categoryType = type === "payable" ? "expense" : "income";
  const typeCategories = categoriesForType(categoryType, allCategories);

  const amountCents = parseAmountToCents(state.amount);
  const installments = Number(state.totalInstallments);
  const showInstallmentPreview =
    !isEditing &&
    amountCents !== null &&
    amountCents > 0 &&
    Number.isInteger(installments) &&
    installments > 1 &&
    isValidISODate(state.dueDate);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
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

    const nextErrors = validate(state, typeCategories.map((item) => item.id), isEditing);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cents = parseAmountToCents(state.amount);
    if (cents === null || cents <= 0) return;

    setIsSaving(true);
    setSubmitError(null);
    try {
      const saved = isEditing
        ? [
            await update(bill!.id, {
              description: state.description.trim(),
              amountCents: cents,
              categoryId: state.categoryId,
              accountId: state.accountId,
              dueDate: state.dueDate,
              notes: state.notes.trim() || undefined,
            } satisfies BillUpdateDraft),
          ]
        : await create({
            type,
            description: state.description.trim(),
            amountCents: cents,
            categoryId: state.categoryId,
            accountId: state.accountId,
            dueDate: state.dueDate,
            totalInstallments: installments,
            notes: state.notes.trim() || undefined,
          } satisfies BillDraft);
      onSaved?.(saved);
      onOpenChange(false);
    } catch {
      setSubmitError(
        isEditing
          ? "Não foi possível salvar as alterações. Tente novamente."
          : "Não foi possível salvar a conta. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar conta"
              : type === "payable"
                ? "Nova conta a pagar"
                : "Nova conta a receber"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da conta pendente. Contas quitadas voltam a pendentes pelo botão “Desfazer baixa”."
              : "Registre o compromisso com vencimento. A baixa poderá gerar um lançamento automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bill-amount">Valor</Label>
              <Input
                id="bill-amount"
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
              <Label htmlFor="bill-due-date">{isEditing ? "Vencimento" : "Primeiro vencimento"}</Label>
              <Input
                id="bill-due-date"
                type="date"
                value={state.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
                aria-invalid={Boolean(errors.dueDate)}
                disabled={isSaving}
              />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bill-description">Descrição</Label>
            <Input
              id="bill-description"
              placeholder={type === "payable" ? "Ex.: Conta de luz" : "Ex.: Salário mensal"}
              value={state.description}
              onChange={(event) => updateField("description", event.target.value)}
              aria-invalid={Boolean(errors.description)}
              disabled={isSaving}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bill-category">Categoria</Label>
              <Select
                value={state.categoryId || undefined}
                onValueChange={(value) => updateField("categoryId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="bill-category"
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
              <Label htmlFor="bill-account">Conta financeira</Label>
              <Select
                value={state.accountId}
                onValueChange={(value) => updateField("accountId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="bill-account"
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

          {isEditing ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {bill!.totalInstallments > 1
                ? `Parcela ${bill!.installmentNumber} de ${bill!.totalInstallments} · o valor é específico desta parcela.`
                : "Conta à vista."}
            </p>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="bill-installments">Parcelas</Label>
              <Input
                id="bill-installments"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_INSTALLMENTS}
                value={state.totalInstallments}
                onChange={(event) => updateField("totalInstallments", event.target.value)}
                aria-invalid={Boolean(errors.totalInstallments)}
                disabled={isSaving}
                className="sm:max-w-32"
              />
              {errors.totalInstallments && (
                <p className="text-xs text-destructive">{errors.totalInstallments}</p>
              )}
              {showInstallmentPreview && (
                <p className="text-xs text-muted-foreground">
                  {installments}x de{" "}
                  {formatCurrency(
                    centsToReais(planInstallments(amountCents!, installments, state.dueDate)[0].amountCents),
                  )}{" "}
                  · vencimentos mensais a partir de {formatDate(state.dueDate)}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="bill-notes">Observações (opcional)</Label>
            <Textarea
              id="bill-notes"
              placeholder="Algum detalhe importante sobre esta conta"
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
          <p className="text-xs text-muted-foreground">Valores em reais · salvos neste dispositivo</p>
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
                  : "Criar conta"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
