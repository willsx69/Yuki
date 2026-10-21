import { LocalStorageTransactionRepository } from "./local-repository";
import type { Transaction, TransactionDraft } from "./types";

/**
 * Contrato de persistência das transações.
 *
 * ETAPA 2 — implementação provisória: enquanto não houver credenciais de
 * banco configuradas, `createTransactionRepository()` devolve o repositório
 * local (`local-repository.ts`), que salva os dados no localStorage do
 * navegador (sobrevive a navegação e recarregamento da página).
 *
 * MIGRAÇÃO PARA POSTGRESQL/SUPABASE:
 * 1. Criar as tabelas descritas em `supabase/schema.sql`;
 * 2. Configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY;
 * 3. Implementar `SupabaseTransactionRepository` cumprindo esta interface;
 * 4. Trocar a fábrica abaixo. Nenhuma alteração será necessária na UI.
 */
export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  create(draft: TransactionDraft): Promise<Transaction>;
  update(id: string, draft: TransactionDraft): Promise<Transaction>;
  remove(id: string): Promise<void>;
}

export function createTransactionRepository(): TransactionRepository {
  // Sem credenciais de banco externo nesta etapa: usa a camada local.
  // Quando o Supabase estiver configurado, esta fábrica passará a devolver
  // a implementação remota (as credenciais nunca são escritas no código).
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Credenciais do Supabase detectadas, mas o repositório remoto ainda não foi implementado. " +
        "Remova as variáveis ou implemente SupabaseTransactionRepository.",
    );
  }

  return new LocalStorageTransactionRepository();
}
