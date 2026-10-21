"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBills } from "@/hooks/use-bills";
import type { Bill } from "@/lib/bills/types";
import { createDebtRepository } from "@/lib/debts/repository";
import type { DebtRepository } from "@/lib/debts/repository";
import type { Debt, DebtDraft } from "@/lib/debts/types";

/**
 * Fonte única de dados das dívidas (Etapa 3).
 *
 * A dívida guarda apenas o contrato (parcela, total, pagas iniciais...).
 * As parcelas pendentes são `Bill`s reais vinculadas por `debtId` — mesmas
 * regras de vencimento, baixa e transação das contas a pagar. Deve ficar
 * dentro de <BillsProvider>.
 */

export type DebtsStatus = "loading" | "ready" | "error";

type DebtsContextValue = {
  status: DebtsStatus;
  debts: Debt[];
  /** Cria a dívida e gera as parcelas pendentes automaticamente. */
  create: (draft: DebtDraft) => Promise<Debt>;
  /**
   * Atualiza o contrato: parcelas pagas são preservadas; as pendentes são
   * recriadas com o novo valor/quantidade (mesma base de vencimento).
   */
  update: (id: string, patch: DebtDraft) => Promise<Debt>;
  /** Encerra antes da última parcela sem marcar pendentes como pagas. */
  settleEarly: (id: string) => Promise<Debt>;
  /** Cancela; parcelas pagas e histórico são preservados. */
  cancel: (id: string) => Promise<void>;
  reload: () => void;
  error: string | null;
};

const DebtsContext = createContext<DebtsContextValue | null>(null);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const bills = useBills();

  const repositoryRef = useRef<DebtRepository | null>(null);
  if (repositoryRef.current === null) {
    repositoryRef.current = createDebtRepository();
  }

  const [debts, setDebts] = useState<Debt[]>([]);
  const [status, setStatus] = useState<DebtsStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    repositoryRef
      .current!.list()
      .then((items) => {
        if (cancelled) return;
        setDebts(items);
        setError(null);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível carregar as dívidas salvas.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  /** Cria as parcelas pendentes de uma dívida como bills vinculados. */
  const createInstallments = useCallback(
    async (debt: Debt, baseDate: string) => {
      const remaining = debt.totalInstallments - debt.initialPaidInstallments;
      if (remaining <= 0) return;
      await bills.create({
        type: "payable",
        description: debt.name,
        amountCents: debt.installmentCents,
        categoryId: debt.categoryId,
        accountId: debt.accountId,
        dueDate: baseDate,
        totalInstallments: debt.totalInstallments,
        installmentsToGenerate: remaining,
        installmentStart: debt.initialPaidInstallments + 1,
        perInstallmentAmount: true,
        debtId: debt.id,
        notes: `Credor: ${debt.creditor}`,
      });
    },
    [bills],
  );

  /** Remove todas as parcelas pendentes (não pagas) de uma dívida. */
  const removePendingInstallments = useCallback(
    async (debtId: string) => {
      const pending = bills.bills
        .filter((bill: Bill) => bill.debtId === debtId && bill.status === "pending")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      for (const bill of pending) {
        await bills.remove(bill.id);
      }
      return pending;
    },
    [bills],
  );

  const create = useCallback(
    async (draft: DebtDraft) => {
      const debt = await repositoryRef.current!.create(draft);
      await createInstallments(debt, debt.firstPendingDueDate);
      setDebts((current) => [debt, ...current]);
      return debt;
    },
    [createInstallments],
  );

  const update = useCallback(
    async (id: string, patch: DebtDraft) => {
      const debt = await repositoryRef.current!.update(id, patch);

      // Preserva pagamentos: remove apenas as pendentes e recria o cronograma
      // restante a partir do primeiro vencimento ainda em aberto.
      const removed = await removePendingInstallments(id);
      const baseDate = removed[0]?.dueDate ?? debt.firstPendingDueDate;
      const paidInApp = bills.bills.filter(
        (bill: Bill) => bill.debtId === id && bill.status === "paid",
      ).length;
      const startNumber = debt.initialPaidInstallments + paidInApp + 1;
      const remaining = debt.totalInstallments - startNumber + 1;

      if (remaining > 0) {
        await bills.create({
          type: "payable",
          description: debt.name,
          amountCents: debt.installmentCents,
          categoryId: debt.categoryId,
          accountId: debt.accountId,
          dueDate: baseDate,
          totalInstallments: debt.totalInstallments,
          installmentsToGenerate: remaining,
          installmentStart: startNumber,
          perInstallmentAmount: true,
          debtId: debt.id,
          notes: `Credor: ${debt.creditor}`,
        });
      }

      setDebts((current) => current.map((item) => (item.id === id ? debt : item)));
      return debt;
    },
    [bills, removePendingInstallments],
  );

  const settleEarly = useCallback(
    async (id: string) => {
      const debt = await repositoryRef.current!.settleEarly(id);
      // Pendentes são descartadas SEM virar pagas fictícias; pagas ficam.
      await removePendingInstallments(id);
      setDebts((current) => current.map((item) => (item.id === id ? debt : item)));
      return debt;
    },
    [removePendingInstallments],
  );

  const cancel = useCallback(
    async (id: string) => {
      const debt = await repositoryRef.current!.cancel(id);
      await removePendingInstallments(id);
      setDebts((current) => current.map((item) => (item.id === id ? debt : item)));
    },
    [removePendingInstallments],
  );

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadToken((token) => token + 1);
  }, []);

  const sortedDebts = useMemo(
    () => [...debts].sort((a, b) => b.firstPendingDueDate.localeCompare(a.firstPendingDueDate)),
    [debts],
  );

  const value = useMemo<DebtsContextValue>(
    () => ({
      status,
      debts: sortedDebts,
      create,
      update,
      settleEarly,
      cancel,
      reload,
      error,
    }),
    [status, sortedDebts, create, update, settleEarly, cancel, reload, error],
  );

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebtsContext(): DebtsContextValue {
  const context = useContext(DebtsContext);
  if (!context) {
    throw new Error("useDebts deve ser usado dentro de <DebtsProvider>.");
  }
  return context;
}
