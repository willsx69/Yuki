import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocalStorageDebtRepository } from "./local-repository";
import { SupabaseDebtRepository } from "./supabase-repository";
import type { Debt, DebtDraft } from "./types";

/**
 * Contrato de persistência das dívidas (Etapa 3 — módulo Dívidas).
 *
 * A orquestração das parcelas (`Bill` vinculadas via `debtId`) vive na camada
 * de provider (DebtsProvider), que usa este repositório para a dívida e o
 * repositório de bills para as parcelas.
 *
 * ETAPA 3 — multiusuário: com o Supabase configurado a fábrica devolve
 * `SupabaseDebtRepository` (sessão em cookies + RLS); sem credenciais,
 * mantém a camada local provisória (localStorage). A UI não muda.
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
  if (isSupabaseConfigured()) {
    return new SupabaseDebtRepository();
  }

  return new LocalStorageDebtRepository();
}
