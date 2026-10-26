import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetupGate } from "@/components/auth/setup-gate";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Confirme seu e-mail" };

/** Rota dinâmica: lê `searchParams` para exibir o e-mail informado. */
export const instant = false;

type ConfirmacaoPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ConfirmacaoPage({ searchParams }: ConfirmacaoPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;

  return (
    <AuthShell
      title="Confirme seu e-mail"
      description="Falta pouco para ativar a sua conta no Yuki."
      footer={
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <SetupGate>
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-primary/25 bg-accent px-3 py-2.5 text-sm">
          <MailCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="leading-relaxed text-accent-foreground">
            Enviamos um e-mail de confirmação para a conta cadastrada. Abra o link para
            ativar o acesso e definir as suas preferências iniciais.
          </p>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Não encontrou o e-mail? Verifique a caixa de spam ou reenvie abaixo.
        </p>

        <ResendConfirmationForm defaultEmail={email} />

        <div className="mt-4">
          <Button asChild variant="ghost" className="w-full" size="lg">
            <Link href="/login">Já tenho conta — entrar</Link>
          </Button>
        </div>
      </SetupGate>
    </AuthShell>
  );
}
