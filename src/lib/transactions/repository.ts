import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocalStorageTransactionRepository } from "./local-repository";
import { SupabaseTransactionRepository } from "./supabase-repository";
import type { Transaction, TransactionDraft } from "./types";

/**
 * Contrato de persistência das transações.
 *
 * ETAPA 3 — multiusuário:
 * - Com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 *   configuradas, a fábrica devolve `SupabaseTransactionRepository`
 *   (`supabase-repository.ts`), autenticado por sessão (cookies) e isolado
 *   por Row Level Security no banco;
 * - Sem credenciais, mantém a camada local provisória
 *   (`local-repository.ts`, localStorage deste navegador).
 *
 * A UI consome apenas esta interface — nenhuma tela precisa mudar.
 */
export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  create(draft: TransactionDraft): Promise<Transaction>;
  update(id: string, draft: TransactionDraft): Promise<Transaction>;
  remove(id: string): Promise<void>;
}

export function createTransactionRepository(): TransactionRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseTransactionRepository();
  }

  return new LocalStorageTransactionRepository();
}
