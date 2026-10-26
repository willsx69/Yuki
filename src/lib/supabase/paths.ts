/**
 * Helpers de caminho usados pelo proxy e pelas rotas de autenticação.
 * Separados de `server.ts` para que o proxy (edge) não precise importar
 * `next/headers`.
 */

/**
 * Aceita apenas caminhos internos seguros (começando com "/", sem "//",
 * sem "http://"). Evita open redirects.
 */
export function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/auth/")) return null;
  return value;
}

/**
 * Caminho de login preservando o destino original solicitado
 * (usado no redirecionamento do servidor quando não há sessão).
 */
export function loginPathFor(pathname: string | null | undefined): string {
  const next = sanitizeNextPath(pathname);
  if (!next || next === "/" || next === "/dashboard" || next === "/login") {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(next)}`;
}
