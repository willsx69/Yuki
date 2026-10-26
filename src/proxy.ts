import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeNextPath } from "@/lib/supabase/paths";

/**
 * Guardião de sessão (ETAPA 3 — multiusuário).
 *
 * 1. Renova a sessão do Supabase gravando os cookies atualizados na
 *    resposta (padrão recomendado pelo `@supabase/ssr`);
 * 2. Redireciona otimistamente: sem sessão em rota privada → /login;
 *    com sessão em página pública → /dashboard.
 *
 * A verificação AUTORIZATIVA acontece no servidor, em
 * `src/app/(app)/layout.tsx`, que consulta `auth.getUser()` (token
 * validado com o Supabase) antes de renderizar qualquer dado. Este
 * arquivo é apenas a camada de redirecionamento/otimismo.
 */

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
  "/confirmacao",
  "/auth",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  // Sem Supabase configurado a aplicação segue no modo local provisório.
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valida o JWT com o servidor do Supabase (não confia no cookie cru).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirect = (targetPath: string, targetSearch = ""): NextResponse => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    url.search = targetSearch;
    const redirectResponse = NextResponse.redirect(url);
    // Preserva cookies renovados durante a verificação da sessão.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  if (!user && !isPublicPath(pathname)) {
    const next = sanitizeNextPath(pathname);
    if (next && next !== "/" && next !== "/dashboard") {
      return redirect("/login", `?next=${encodeURIComponent(next)}`);
    }
    return redirect("/login");
  }

  if (user && isPublicPath(pathname)) {
    return redirect("/dashboard");
  }

  // Header consumido pelo layout da área privada (rota original solicitada).
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Tudo, exceto assets estáticos e arquivos de manifesto/ícones.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
