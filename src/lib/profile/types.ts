/**
 * Perfil do usuário (ETAPA 3 — multiusuário).
 *
 * Espelha a tabela `public.profiles` (supabase/migrations/00002_profiles.sql).
 * Guarda apenas exibição e preferências — credenciais ficam no Supabase Auth.
 */
export type ProfileTheme = "light" | "dark" | "system";

export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  currency: string;
  language: string;
  theme: ProfileTheme;
  onboardingCompleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** Linha bruta vinda do Postgres (snake_case). */
export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  currency: string;
  language: string;
  theme: string;
  onboarding_completed: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export function mapProfileRow(row: ProfileRow | null | undefined): Profile | null {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    currency: row.currency,
    language: row.language,
    theme: row.theme === "light" || row.theme === "dark" ? row.theme : "system",
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
