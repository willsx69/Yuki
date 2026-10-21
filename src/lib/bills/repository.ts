import { LocalStorageBillRepository } from "./local-repository";
import type { Bill, BillDraft, BillUpdateDraft } from "./types";

/**
 * Contrato de persistência das contas a pagar/receber (Etapa 3).
 *
 * ETAPA 3 — implementação provisória: enquanto não houver credenciais de
 * banco configuradas, `createBillRepository()` devolve o repositório local
 * (`local-repository.ts`), que salva os dados no localStorage do navegador
 * (sobrevive a navegação e recarregamento da página).
 *
 * A baixa (markPaid) recebe o id do lançamento criado em `transactions`
 * para permitir desfazer a baixa depois.
 *
 * MIGRAÇÃO PARA POSTGRESQL/SUPABASE:
 * 1. Criar as tabelas descritas em `supabase/schema.sql`;
 * 2. Configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY;
 * 3. Implementar `SupabaseBillRepository` cumprindo esta interface;
 * 4. Trocar a fábrica abaixo. Nenhuma alteração será necessária na UI.
 */
export interface BillRepository {
  list(): Promise<Bill[]>;
  /** Cria 1 conta (à vista) ou N parcelas mensais; retorna as contas criadas. */
  createDraft(draft: BillDraft): Promise<Bill[]>;
  /** Edita uma conta pendente; contas quitadas exigem desfazer a baixa antes. */
  update(id: string, patch: BillUpdateDraft): Promise<Bill>;
  remove(id: string): Promise<void>;
  markPaid(id: string, paidAt: string, linkedTransactionId: string): Promise<Bill>;
  markUnpaid(id: string): Promise<Bill>;
}

export function createBillRepository(): BillRepository {
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
        "Remova as variáveis ou implemente SupabaseBillRepository.",
    );
  }

  return new LocalStorageBillRepository();
}
