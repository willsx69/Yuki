import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isLocalStorageAvailable } from "@/lib/transactions/local-repository";

/**
 * Os dados são persistidos?
 * - Com Supabase configurado: sim (banco, isolado por RLS);
 * - Sem Supabase: depende do localStorage deste navegador (modo local
 *   provisório, sem autenticação).
 */
export function isPersistenceAvailable(): boolean {
  return isSupabaseConfigured() || isLocalStorageAvailable();
}
