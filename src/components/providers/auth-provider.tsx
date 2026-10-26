"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchProfile } from "@/lib/profile/repository";
import type { Profile } from "@/lib/profile/types";

/**
 * Sessão e perfil do usuário autenticado, compartilhados com a interface
 * (menu do usuário, configurações, primeiro acesso).
 *
 * A proteção das rotas acontece no servidor
 * (`src/app/(app)/layout.tsx` + `src/proxy.ts`); este contexto serve apenas
 * para exibir dados da sessão no cliente.
 */

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** Recarrega o perfil após uma atualização. */
  refreshProfile: () => Promise<void>;
  /** Encerra a sessão e volta para o login. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
};

export function AuthProvider({ children, initialUser = null, initialProfile = null }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  // Sem Supabase configurado não há sessão a esperar: já inicia em false.
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = createSupabaseBrowserClient();
    setProfile(await fetchProfile(supabase, userId));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const nextUser = data.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          void loadProfile(nextUser.id);
        } else {
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        void loadProfile(nextUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id);
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, loading, refreshProfile, signOut }),
    [user, profile, loading, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de <AuthProvider>.");
  }
  return context;
}
