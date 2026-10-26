import type { SupabaseClient } from "@supabase/supabase-js";
import { mapProfileRow, type Profile, type ProfileRow } from "./types";

/**
 * Lê o perfil do usuário autenticado.
 * As políticas de RLS garantem que só é possível ler o próprio registro —
 * não há filtro manual de `user_id` para "consertar" consultas erradas.
 */
export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, currency, language, theme, onboarding_completed, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return mapProfileRow(data as ProfileRow | null);
}
