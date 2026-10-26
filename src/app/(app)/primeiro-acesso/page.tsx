import type { Metadata } from "next";
import { LogoMark } from "@/components/layout/logo-mark";
import { OnboardingForm } from "@/components/settings/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Primeiro acesso" };

/**
 * Configuração inicial — rota acessada após o cadastro/primeiro login.
 * Deliberadamente curta: nome, moeda e idioma. Nenhuma conta bancária ou
 * saldo fictício é criado automaticamente.
 */
export default function PrimeiroAcessoPage() {
  return (
    <div className="mx-auto w-full max-w-lg py-6">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <LogoMark className="size-12" />
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            Bem-vindo ao Yuki
          </p>
          <p className="text-sm text-muted-foreground">
            Leva menos de um minuto para deixar tudo do seu jeito.
          </p>
        </div>
      </div>

      <Card className="border-border/70 shadow-[0_18px_45px_-24px_rgba(76,29,149,0.35)]">
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="text-xl tracking-tight">Vamos começar</CardTitle>
          <CardDescription className="text-sm">
            Confirme o seu nome e escolha as preferências iniciais. Você pode ajustar tudo
            depois em Configurações.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
