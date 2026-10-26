"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeNextPath } from "@/lib/supabase/paths";
import { isValidEmail, nameIssues, passwordIssues } from "@/lib/auth/validation";

/**
 * Server actions de autenticação (ETAPA 3).
 *
 * Toda validação acontece NO SERVIDOR (o cliente só antecipa o feedback);
 * as credenciais são gerenciadas pelo Supabase Auth — nenhuma senha é
 * gravada pela aplicação, e a sessão vive em cookies via @supabase/ssr.
 */

export type AuthFormState = {
  fieldErrors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    terms?: string[];
  };
  /** Erro geral do formulário (credenciais, rede, limite de tentativas...). */
  formError?: string;
  /** Mensagem informativa (ex.: "enviamos um e-mail"). */
  info?: string;
  success?: boolean;
  needsEmailConfirmation?: boolean;
  redirectTo?: string;
} | undefined;

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

/** Estado de erro quando o Supabase ainda não foi configurado. */
function notConfiguredState(): AuthFormState {
  return {
    formError:
      "O Supabase ainda não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local e aplique as migrações de supabase/migrations/.",
  };
}

function errorMessage(error: { message: string } | null): string {
  if (!error) return "Não foi possível concluir a operação. Tente novamente.";
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Muitas tentativas em curto período. Aguarde alguns minutos e tente novamente.";
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Já existe uma conta com este e-mail. Tente recuperar a senha.";
  }
  if (message.includes("password should be different")) {
    return "A nova senha deve ser diferente da senha atual.";
  }
  if (message.includes("weak_password")) {
    return "A senha é muito fraca. Use pelo menos 8 caracteres, com letra e número.";
  }
  if (message.includes("signups not allowed")) {
    return "O cadastro está desativado neste projeto.";
  }
  if (message.includes("database error") || message.includes("unexpected failure")) {
    return "Não foi possível concluir agora. Tente novamente em instantes.";
  }
  return "Não foi possível concluir a operação. Verifique os dados e tente novamente.";
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfiguredState();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const acceptedTerms =
    formData.get("acceptedTerms") === "on" || formData.get("acceptedTerms") === "true";

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  const nameError = nameIssues(name);
  if (nameError.length > 0) fieldErrors.name = nameError;
  if (!isValidEmail(email)) fieldErrors.email = ["Informe um e-mail válido."];
  const passwordError = passwordIssues(password);
  if (passwordError.length > 0) fieldErrors.password = passwordError;
  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = ["As senhas não conferem."];
  }
  if (!acceptedTerms) {
    fieldErrors.terms = ["É preciso aceitar os termos para criar a conta."];
  }
  if (fieldErrors.name || fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword || fieldErrors.terms) {
    return { fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/primeiro-acesso`,
      data: { full_name: name },
    },
  });

  if (error) {
    return { formError: errorMessage(error) };
  }

  // Conta já existente com confirmação de e-mail ativa devolve um usuário
  // sem identidades — tratamos como duplicidade sem vazar dados.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      formError: "Já existe uma conta com este e-mail. Tente recuperar a senha.",
    };
  }

  // Sem sessão = confirmação de e-mail pendente (configuração do projeto).
  if (!data.session) {
    return {
      success: true,
      needsEmailConfirmation: true,
      redirectTo: `/confirmacao?email=${encodeURIComponent(email)}`,
    };
  }

  return { success: true, redirectTo: "/primeiro-acesso" };
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfiguredState();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNextPath(String(formData.get("next") ?? ""));

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  if (!isValidEmail(email)) fieldErrors.email = ["Informe um e-mail válido."];
  if (!password) fieldErrors.password = ["Informe a sua senha."];
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { formError: errorMessage(error) };
  }

  return { success: true, redirectTo: next ?? "/dashboard" };
}

export async function recoverPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfiguredState();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  if (!isValidEmail(email)) fieldErrors.email = ["Informe um e-mail válido."];
  if (fieldErrors.email) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { formError: errorMessage(error) };
  }

  // Sem enumeração de contas: a mensagem vale para qualquer e-mail.
  return {
    success: true,
    info: "Se existir uma conta com este e-mail, você receberá um link de recuperação em instantes.",
  };
}

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfiguredState();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  const passwordError = passwordIssues(password);
  if (passwordError.length > 0) fieldErrors.password = passwordError;
  if (confirmPassword !== password) {
    fieldErrors.confirmPassword = ["As senhas não conferem."];
  }
  if (fieldErrors.password || fieldErrors.confirmPassword) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("session") || message.includes("claims")) {
      return {
        formError: "O link de redefinição expirou ou já foi usado. Solicite um novo.",
        redirectTo: "/recuperar-senha",
      };
    }
    return { formError: errorMessage(error) };
  }

  return { success: true, redirectTo: "/dashboard" };
}

export async function resendConfirmationAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return notConfiguredState();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const fieldErrors: NonNullable<AuthFormState>["fieldErrors"] = {};
  if (!isValidEmail(email)) fieldErrors.email = ["Informe um e-mail válido."];
  if (fieldErrors.email) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/primeiro-acesso` },
  });

  if (error) {
    return { formError: errorMessage(error) };
  }

  return { success: true, info: "Enviamos um novo e-mail de confirmação, se a conta existir." };
}
