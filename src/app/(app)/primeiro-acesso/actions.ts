"use server";

import { parseProfileForm } from "@/lib/profile/form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { repositoryError } from "@/lib/supabase/errors";

/**
 * Primeiro acesso: confirma o nome e a moeda preferencial e encerra o
 * onboarding. Nada além disso é obrigatório — o usuário cai no dashboard
 * vazio e cadastra a primeira conta/movimentação quando quiser.
 */

export type OnboardingFormState = {
  fieldErrors?: {
    displayName?: string[];
    currency?: string[];
    language?: string[];
  };
  formError?: string;
  success?: boolean;
} | undefined;

export async function completeOnboardingAction(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  if (!isSupabaseConfigured()) {
    return {
      formError: "O Supabase ainda não está configurado; não é possível iniciar.",
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
    return { formError: "Sessão expirada. Entre novamente." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: values.displayName,
      currency: values.currency,
      language: values.language,
      theme: values.theme,
      onboarding_completed: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    return {
      formError: repositoryError("Não foi possível concluir a configuração.", error).message,
    };
  }

  return { success: true };
}
