import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocalStorageBillRepository } from "./local-repository";
import { SupabaseBillRepository } from "./supabase-repository";
import type { Bill, BillDraft, BillUpdateDraft } from "./types";

/**
 * Contrato de persistência das contas a pagar/receber (Etapa 3).
 *
 * A baixa (markPaid) recebe o id do lançamento criado em `transactions`
 * para permitir desfazer a baixa depois.
 *
 * ETAPA 3 — multiusuário: com o Supabase configurado a fábrica devolve
 * `SupabaseBillRepository` (sessão em cookies + RLS); sem credenciais,
 * mantém a camada local provisória (localStorage). A UI não muda.
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
  if (isSupabaseConfigured()) {
    return new SupabaseBillRepository();
  }

  return new LocalStorageBillRepository();
}
