import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured, isSupabaseConfigured } from "./config";

/**
 * Cliente Supabase para o navegador.
 *
 * A sessão é persistida em cookies (padrão `@supabase/ssr`), o que permite
 * que o servidor (proxy, layouts e server actions) valide a mesma sessão.
 * Toda consulta feita por este cliente passa pelas políticas RLS: um
 * usuário autenticado só enxerga as próprias linhas.
 */
let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (ver .env.example).",
    );
  }

  if (browserClient === null) {
    const { url, anonKey } = assertSupabaseConfigured();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
