"use server";

import { parseProfileForm } from "@/lib/profile/form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { repositoryError } from "@/lib/supabase/errors";

/**
 * Atualiza o perfil do usuário autenticado (Configurações).
 * O `id` vem da sessão — nunca do formulário — e a política RLS de
 * `profiles` garante que só o próprio registro pode ser alterado.
 * E-mail e senha são gerenciados pelo Supabase Auth, não aqui.
 */

export type ProfileFormState = {
  fieldErrors?: {
    displayName?: string[];
    currency?: string[];
    language?: string[];
  };
  formError?: string;
  success?: boolean;
} | undefined;

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  if (!isSupabaseConfigured()) {
    return {
      formError:
        "O Supabase ainda não está configurado; o perfil não pode ser salvo na nuvem.",
    };
  }

  const { values, fieldErrors } = parseProfileForm(formData);
  if (fieldErrors.displayName || fieldErrors.currency || fieldErrors.language) {
    return { fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { formError: "Sessão expirada. Entre novamente para salvar o perfil." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: values.displayName,
      currency: values.currency,
      language: values.language,
    })
    .eq("id", user.id);

  if (error) {
    return { formError: repositoryError("Não foi possível salvar o perfil.", error).message };
  }

  return { success: true };
}
