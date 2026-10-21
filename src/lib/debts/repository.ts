import { LocalStorageDebtRepository } from "./local-repository";
import type { Debt, DebtDraft } from "./types";

/**
 * Contrato de persistência das dívidas (Etapa 3 — módulo Dívidas).
 *
 * A orquestração das parcelas (`Bill` vinculadas via `debtId`) vive na camada
 * de provider (DebtsProvider), que usa este repositório para a dívida e o
 * repositório de bills para as parcelas.
 *
 * MIGRAÇÃO PARA POSTGRESQL/SUPABASE:
 * 1. Criar as tabelas descritas em `supabase/schema.sql`;
 * 2. Configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY;
 * 3. Implementar `SupabaseDebtRepository` cumprindo esta interface;
 * 4. Trocar a fábrica abaixo. Nenhuma alteração será necessária na UI.
 */
export interface DebtRepository {
  list(): Promise<Debt[]>;
  create(draft: DebtDraft): Promise<Debt>;
  /** Atualiza os dados contratuais; parcelas pendentes são recriadas pelo provider. */
  update(id: string, patch: DebtDraft): Promise<Debt>;
  /** Encerra a dívida antes da última parcela, sem marcar pendentes como pagas. */
  settleEarly(id: string): Promise<Debt>;
  /** Cancela a dívida; parcelas pagas e histórico são preservados. */
  cancel(id: string): Promise<Debt>;
}

export function createDebtRepository(): DebtRepository {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Credenciais do Supabase detectadas, mas o repositório remoto ainda não foi implementado. " +
        "Remova as variáveis ou implemente SupabaseDebtRepository.",
    );
  }

  return new LocalStorageDebtRepository();
}
