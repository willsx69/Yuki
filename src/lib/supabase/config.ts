/**
 * Configuração do Supabase (ETAPA 3 — multiusuário).
 *
 * As credenciais públicas vêm do ambiente (`.env.local`) e nunca são
 * escritas no código. Apenas a chave `anon` é exposta ao navegador: o
 * isolamento dos dados é garantido pelo Row Level Security no banco
 * (ver supabase/migrations/), não por filtros do frontend.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * true quando NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 * estão preenchidas. Sem isso a aplicação continua no modo local
 * provisório (localStorage, um único usuário neste navegador) — ver
 * README, seção "Persistência dos dados".
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Erro claro caso o código tente criar um cliente sem configuração. */
export function assertSupabaseConfigured(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (ver .env.example).",
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}
