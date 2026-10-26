import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SetupGate } from "@/components/auth/setup-gate";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Redefinir senha" };

/** Rota dinâmica: valida a sessão vinda do link (cookies) no servidor. */
export const instant = false;

export default async function RedefinirSenhaPage() {
  // A sessão vem do link enviado por e-mail (via /auth/callback).
  const hasSession = isSupabaseConfigured() ? Boolean(await getServerUser()) : false;

  return (
    <AuthShell
      title="Redefinir senha"
      description="Escolha uma nova senha para a sua conta."
      footer={
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <SetupGate>
        {hasSession ? (
          <ResetPasswordForm />
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-accent px-3 py-2.5 text-sm">
              <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="leading-relaxed text-accent-foreground">
                Este link é válido apenas através do e-mail de recuperação. Solicite um
                novo link para redefinir a senha.
              </p>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link href="/recuperar-senha">Solicitar novo link</Link>
            </Button>
          </div>
        )}
      </SetupGate>
    </AuthShell>
  );
}
