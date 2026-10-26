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
import { sortByDateDesc } from "@/lib/transactions/finance";
import { createTransactionRepository } from "@/lib/transactions/repository";
import type { TransactionRepository } from "@/lib/transactions/repository";
import type { Category, Transaction, TransactionDraft } from "@/lib/transactions/types";
import { isPersistenceAvailable } from "@/lib/persistence";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Fonte única de dados das transações do usuário.
 *
 * Os lançamentos reais são carregados/salvos pelo repositório
 * (atualmente localStorage — camada provisória claramente identificada em
 * src/lib/transactions/local-repository.ts). Os dados de demonstração nunca
 * entram aqui: eles vivem isolados em src/lib/demo-data.ts e o dashboard
 * alterna entre os dois conjuntos sem misturá-los.
 */

export type DataSourceMode = "demo" | "mine";

export type TransactionsStatus = "loading" | "ready" | "error";

type TransactionsContextValue = {
  status: TransactionsStatus;
  transactions: Transaction[];
  /** Categorias personalizadas (estrutura pronta; criação vem em etapa futura). */
  customCategories: Category[];
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
  create: (draft: TransactionDraft) => Promise<Transaction>;
  update: (id: string, draft: TransactionDraft) => Promise<Transaction>;
  remove: (id: string) => Promise<void>;
  reload: () => void;
  /** false quando o navegador não permite localStorage (ex.: modo privado). */
  persistent: boolean;
  error: string | null;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

const MODE_STORAGE_KEY = "finora:data-mode";

function readStoredMode(): DataSourceMode | null {
  try {
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    return stored === "demo" || stored === "mine" ? stored : null;
  } catch {
    return null;
  }
}

function storeMode(mode: DataSourceMode): void {
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // Armazenamento indisponível: o modo vale só nesta sessão.
  }
}

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const repositoryRef = useRef<TransactionRepository | null>(null);
  if (repositoryRef.current === null) {
    repositoryRef.current = createTransactionRepository();
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<TransactionsStatus>("loading");
  const [mode, setModeState] = useState<DataSourceMode>("demo");
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    repositoryRef
      .current!.list()
      .then((items) => {
        if (cancelled) return;
        setTransactions(sortByDateDesc(items));
        // Conta autenticada começa em "Meus lançamentos" (mesmo vazia);
        // no modo local provisório, sem dados o dashboard mostra o exemplo.
        setModeState(
          readStoredMode() ?? (items.length > 0 || isSupabaseConfigured() ? "mine" : "demo"),
        );
        setPersistent(isPersistenceAvailable());
        setError(null);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível carregar as transações salvas.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const setMode = useCallback((next: DataSourceMode) => {
    setModeState(next);
    storeMode(next);
  }, []);

  const create = useCallback(
    async (draft: TransactionDraft) => {
      const created = await repositoryRef.current!.create(draft);
      setTransactions((current) => sortByDateDesc([created, ...current]));
      // Quem acaba de cadastrar deve ver o próprio lançamento no dashboard.
      setMode("mine");
      return created;
    },
    [setMode],
  );

  const update = useCallback(async (id: string, draft: TransactionDraft) => {
    const updated = await repositoryRef.current!.update(id, draft);
    setTransactions((current) =>
      sortByDateDesc(current.map((item) => (item.id === id ? updated : item))),
    );
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await repositoryRef.current!.remove(id);
    setTransactions((current) => current.filter((item) => item.id !== id));
  }, []);

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadToken((token) => token + 1);
  }, []);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      status,
      transactions,
      customCategories: [],
      mode,
      setMode,
      create,
      update,
      remove,
      reload,
      persistent,
      error,
    }),
    [status, transactions, mode, setMode, create, update, remove, reload, persistent, error],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactionsContext(): TransactionsContextValue {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactions deve ser usado dentro de <TransactionsProvider>.");
  }
  return context;
}
