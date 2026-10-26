import type { ProfileTheme } from "./types";
import {
  isSupportedCurrency,
  isSupportedLanguage,
  nameIssues,
} from "@/lib/auth/validation";

/**
 * Leitura e validação do formulário de perfil (Configurações e Primeiro
 * acesso). Validação compartilhada entre cliente e servidor.
 */

export type ProfileFormValues = {
  displayName: string;
  currency: string;
  language: string;
  theme: ProfileTheme;
};

export type ProfileFieldErrors = {
  displayName?: string[];
  currency?: string[];
  language?: string[];
};

export function parseProfileForm(formData: FormData): {
  values: ProfileFormValues;
  fieldErrors: ProfileFieldErrors;
} {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const currency = String(formData.get("currency") ?? "BRL").trim().toUpperCase();
  const language = String(formData.get("language") ?? "pt-BR").trim();
  const rawTheme = String(formData.get("theme") ?? "system").trim();
  const theme: ProfileTheme =
    rawTheme === "light" || rawTheme === "dark" ? rawTheme : "system";

  const fieldErrors: ProfileFieldErrors = {};

  const nameError = nameIssues(displayName);
  if (nameError.length > 0) fieldErrors.displayName = nameError;
  if (!isSupportedCurrency(currency)) {
    fieldErrors.currency = ["Escolha uma moeda suportada."];
  }
  if (!isSupportedLanguage(language)) {
    fieldErrors.language = ["Escolha um idioma suportado."];
  }

  return {
    values: { displayName, currency, language, theme },
    fieldErrors,
  };
}
