import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { BillsProvider } from "@/components/providers/bills-provider";
import { DebtsProvider } from "@/components/providers/debts-provider";
import { TransactionsProvider } from "@/components/providers/transactions-provider";
import { fetchProfile } from "@/lib/profile/repository";
import type { Profile } from "@/lib/profile/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginPathFor } from "@/lib/supabase/paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Área privada do Yuki (ETAPA 3 — multiusuário).
 *
 * Verificação AUTORIZATIVA no servidor: `auth.getUser()` valida o token com
 * o Supabase antes de qualquer dado renderizar. O `src/proxy.ts` apenas
 * antecipa o redirecionamento; aqui é a garantia real.
 *
 * Sem Supabase configurado, a aplicação segue no modo local provisório
 * (localStorage, um único usuário neste navegador) — ver README.
 */

/** Rota dinâmica: valida a sessão (cookies/headers) antes de renderizar. */
export const instant = false;

export default async function AppAreaLayout({ children }: { children: React.ReactNode }) {
  let initialUser = null;
  let initialProfile: Profile | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const headerStore = await headers();
      redirect(loginPathFor(headerStore.get("x-pathname")));
    }

    initialUser = user;
    initialProfile = await fetchProfile(supabase, user.id);

    // Primeiro acesso: configuração leve antes do dashboard vazio.
    if (!initialProfile?.onboardingCompleted) {
      const headerStore = await headers();
      const pathname = headerStore.get("x-pathname") ?? "";
      if (pathname !== "/primeiro-acesso") {
        redirect("/primeiro-acesso");
      }
    }
  }

  return (
    <AuthProvider initialUser={initialUser} initialProfile={initialProfile}>
      <TransactionsProvider>
        <BillsProvider>
          <DebtsProvider>
            <AppShell>{children}</AppShell>
          </DebtsProvider>
        </BillsProvider>
      </TransactionsProvider>
    </AuthProvider>
  );
}
