import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/supabase/paths";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Callbacko de autenticação do Supabase.
 *
 * Recebe o `code` enviado pelos e-mails de confirmação de cadastro e de
 * recuperação de senha, troca por sessão (cookies httpOnly gravados no
 * servidor) e leva o usuário ao destino pedido (`next`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next")) ?? "/dashboard";

  if (isSupabaseConfigured() && code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent("link-invalido")}`,
  );
}
