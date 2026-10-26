import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { assertSupabaseConfigured } from "./config";

/**
 * Cliente Supabase para o servidor (layouts, páginas, server actions e
 * route handlers). Um cliente novo é criado a cada request — nunca o
 * compartilhe entre requests.
 *
 * A sessão vem dos cookies da requisição; renovações de token são
 * devolvidas via `setAll` (não faz nada dentro de Server Components, onde
 * gravar cookies não é permitido — o `proxy.ts` é quem renova a sessão
 * antes do render).
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = assertSupabaseConfigured();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado dentro de Server Component: gravar cookies não é
          // permitido. O proxy.ts já cuida da renovação da sessão.
        }
      },
    },
  });
}

/**
 * Usuário autenticado do request atual (ou null).
 * Use `getUser()` — e não `getSession()` — porque `getUser` valida o token
 * com o servidor do Supabase; `getSession` apenas lê o cookie.
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
