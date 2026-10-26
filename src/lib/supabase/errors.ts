/**
 * Conversão de erros do PostgREST/Supabase em mensagens amigáveis
 * para a interface (os repositórios remotos usam este helper).
 */
export function repositoryError(
  fallbackMessage: string,
  error: { code?: string; message?: string } | null,
): Error {
  const code = error?.code ?? "";
  const message = error?.message ?? "";

  if (
    code === "42501" ||
    code === "PGRST301" ||
    /row-level security|permission denied|not authorized/i.test(message)
  ) {
    return new Error("Você não tem permissão para acessar ou alterar estes dados.");
  }

  if (code === "23503" || /violates foreign key/i.test(message)) {
    return new Error("Registro vinculado a outro dado não encontrado.");
  }

  if (code === "23514" || /check constraint/i.test(message)) {
    return new Error("Os dados enviados não passaram na validação do banco.");
  }

  if (/failed to fetch|networkerror|fetch failed/i.test(message)) {
    return new Error("Não foi possível conectar ao servidor. Verifique a sua conexão.");
  }

  return new Error(fallbackMessage);
}
