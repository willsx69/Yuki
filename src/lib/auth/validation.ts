/**
 * Validação de credenciais — usada TANTO no cliente (feedback imediato)
 * quanto no servidor (server actions), garantindo a mesma política.
 *
 * Política de senha do Yuki: mínimo 8 caracteres, com ao menos uma letra
 * e um número. O Supabase Auth guarda o hash (nunca texto puro).
 */

export const PASSWORD_MIN_LENGTH = 8;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 120;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  const normalized = email.trim();
  return normalized.length <= 254 && EMAIL_REGEX.test(normalized);
}

/** Retorna a lista de requisitos ainda não atendidos (vazia = válida). */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  }
  if (!/[a-zA-ZÀ-ÿ]/.test(password)) {
    issues.push("Inclua ao menos uma letra.");
  }
  if (!/[0-9]/.test(password)) {
    issues.push("Inclua ao menos um número.");
  }
  return issues;
}

export function isValidPassword(password: string): boolean {
  return passwordIssues(password).length === 0;
}

export function nameIssues(name: string): string[] {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return [`Use pelo menos ${NAME_MIN_LENGTH} caracteres.`];
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return [`Use no máximo ${NAME_MAX_LENGTH} caracteres.`];
  }
  return [];
}

/** Moedas suportadas na preferência do perfil (BRL é a inicial). */
export const SUPPORTED_CURRENCIES = [
  { code: "BRL", label: "Real (R$)" },
  { code: "USD", label: "Dólar (US$)" },
  { code: "EUR", label: "Euro (€)" },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en-US", label: "English (US)" },
] as const;

export function isSupportedCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.some((item) => item.code === currency);
}

export function isSupportedLanguage(language: string): boolean {
  return SUPPORTED_LANGUAGES.some((item) => item.code === language);
}
