import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/auth/form-alert";
import { LoginForm } from "@/components/auth/login-form";
import { SetupGate } from "@/components/auth/setup-gate";
import { sanitizeNextPath } from "@/lib/supabase/paths";

export const metadata: Metadata = { title: "Entrar" };

/** Rota dinâmica: lê `searchParams` (e a sessão é verificada no servidor). */
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeNextPath(typeof params.next === "string" ? params.next : null) ?? undefined;
  const erro = typeof params.erro === "string" ? params.erro : null;

  return (
    <AuthShell
      title="Bem-vindo de volta"
      description="Entre com a sua conta para acessar o seu Yuki."
    >
      <SetupGate>
        {erro === "link-invalido" ? (
          <div className="mb-4">
            <FormAlert>
              O link de confirmação é inválido ou expirou. Faça login ou solicite um novo
              e-mail.
            </FormAlert>
          </div>
        ) : null}
        <LoginForm next={next} />
      </SetupGate>
    </AuthShell>
  );
}
