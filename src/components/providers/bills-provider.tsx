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
import { useTransactions } from "@/hooks/use-transactions";
import { sortBillsForList, transactionTypeForBill } from "@/lib/bills/finance";
import { createBillRepository } from "@/lib/bills/repository";
import type { BillRepository } from "@/lib/bills/repository";
import type { Bill, BillDraft, BillUpdateDraft } from "@/lib/bills/types";
import { isLocalStorageAvailable } from "@/lib/transactions/local-repository";
import { todayISODate } from "@/lib/transactions/finance";

/**
 * Fonte única de dados das contas a pagar/receber (Etapa 3).
 *
 * A baixa de uma conta cria um lançamento real de transação (despesa para
 * contas a pagar, receita para contas a receber) e guarda o vínculo em
 * `linkedTransactionId`, permitindo desfazer a baixa. Deve ficar dentro de
 * <TransactionsProvider>.
 */

export type BillsStatus = "loading" | "ready" | "error";

type BillsContextValue = {
  status: BillsStatus;
  bills: Bill[];
  /** Cria 1 conta (à vista) ou N parcelas mensais. */
  create: (draft: BillDraft) => Promise<Bill[]>;
  update: (id: string, patch: BillUpdateDraft) => Promise<Bill>;
  /** Exclui a conta; se houver lançamento vinculado, ele também é excluído. */
  remove: (id: string) => Promise<void>;
  /** Registra a baixa e cria o lançamento vinculado. */
  pay: (id: string, paymentMethodId: string) => Promise<void>;
  /** Desfaz a baixa: remove o lançamento e volta a conta para pendente. */
  unpay: (id: string) => Promise<void>;
  reload: () => void;
  /** false quando o navegador não permite localStorage (ex.: modo privado). */
  persistent: boolean;
  error: string | null;
};

const BillsContext = createContext<BillsContextValue | null>(null);

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const transactions = useTransactions();

  const repositoryRef = useRef<BillRepository | null>(null);
  if (repositoryRef.current === null) {
    repositoryRef.current = createBillRepository();
  }

  const [bills, setBills] = useState<Bill[]>([]);
  const [status, setStatus] = useState<BillsStatus>("loading");
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    repositoryRef
      .current!.list()
      .then((items) => {
        if (cancelled) return;
        setBills(sortBillsForList(items, todayISODate()));
        setPersistent(isLocalStorageAvailable());
        setError(null);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível carregar as contas salvas.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const create = useCallback(async (draft: BillDraft) => {
    const created = await repositoryRef.current!.createDraft(draft);
    setBills((current) => sortBillsForList([...created, ...current], todayISODate()));
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: BillUpdateDraft) => {
    const updated = await repositoryRef.current!.update(id, patch);
    setBills((current) =>
      sortBillsForList(
        current.map((item) => (item.id === id ? updated : item)),
        todayISODate(),
      ),
    );
    return updated;
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const bill = bills.find((item) => item.id === id);
      if (bill?.linkedTransactionId) {
        try {
          await transactions.remove(bill.linkedTransactionId);
        } catch {
          // Lançamento já não existe: segue a exclusão da conta.
        }
      }
      await repositoryRef.current!.remove(id);
      setBills((current) => current.filter((item) => item.id !== id));
    },
    [bills, transactions],
  );

  const pay = useCallback(
    async (id: string, paymentMethodId: string) => {
      const bill = bills.find((item) => item.id === id);
      if (!bill) {
        throw new Error("Conta não encontrada.");
      }
      if (bill.status === "paid") {
        throw new Error("Esta conta já está quitada.");
      }

      const paidAt = todayISODate();
      const linked = await transactions.create({
        type: transactionTypeForBill(bill.type),
        amountCents: bill.amountCents,
        description: bill.description,
        categoryId: bill.categoryId,
        date: paidAt,
        accountId: bill.accountId,
        paymentMethodId,
        notes: `Baixa de ${bill.type === "payable" ? "conta a pagar" : "conta a receber"}.`,
      });

      try {
        const updated = await repositoryRef.current!.markPaid(id, paidAt, linked.id);
        setBills((current) =>
          sortBillsForList(
            current.map((item) => (item.id === id ? updated : item)),
            todayISODate(),
          ),
        );
      } catch (error_) {
        // Baixa falhou: remove o lançamento criado para não deixar órfão.
        try {
          await transactions.remove(linked.id);
        } catch {
          // Melhor esforço — o usuário pode recarregar e conferir.
        }
        throw error_;
      }
    },
    [bills, transactions],
  );

  const unpay = useCallback(
    async (id: string) => {
      const bill = bills.find((item) => item.id === id);
      if (!bill) {
        throw new Error("Conta não encontrada.");
      }
      if (bill.status !== "paid") {
        throw new Error("Esta conta não está quitada.");
      }

      const updated = await repositoryRef.current!.markUnpaid(id);
      setBills((current) =>
        sortBillsForList(
          current.map((item) => (item.id === id ? updated : item)),
          todayISODate(),
        ),
      );
      if (bill.linkedTransactionId) {
        try {
          await transactions.remove(bill.linkedTransactionId);
        } catch {
          // Lançamento já não existe: a conta mesmo assim volta a pendente.
        }
      }
    },
    [bills, transactions],
  );

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadToken((token) => token + 1);
  }, []);

  const value = useMemo<BillsContextValue>(
    () => ({
      status,
      bills,
      create,
      update,
      remove,
      pay,
      unpay,
      reload,
      persistent,
      error,
    }),
    [status, bills, create, update, remove, pay, unpay, reload, persistent, error],
  );

  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>;
}

export function useBillsContext(): BillsContextValue {
  const context = useContext(BillsContext);
  if (!context) {
    throw new Error("useBills deve ser usado dentro de <BillsProvider>.");
  }
  return context;
}
