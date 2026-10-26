"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import {
  completeOnboardingAction,
  type OnboardingFormState,
} from "@/app/(app)/primeiro-acesso/actions";
import { FieldErrors, FormAlert } from "@/components/auth/form-alert";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from "@/lib/auth/validation";

/** Configuração inicial (primeiro acesso) — leve e opcional além do essencial. */
export function OnboardingForm() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuthContext();
  const [state, formAction, pending] = useActionState<OnboardingFormState, FormData>(
    completeOnboardingAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      void refreshProfile().then(() => {
        router.push("/dashboard");
        router.refresh();
      });
    }
  }, [state, router, refreshProfile]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.formError ? <FormAlert>{state.formError}</FormAlert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-name">Como podemos te chamar?</Label>
        <Input
          id="onboarding-name"
          name="displayName"
          type="text"
          autoComplete="name"
          defaultValue={profile?.displayName && profile.displayName !== "Usuário" ? profile.displayName : ""}
          placeholder="Seu nome"
          disabled={pending}
          aria-invalid={Boolean(state?.fieldErrors?.displayName) || undefined}
          required
        />
        <FieldErrors errors={state?.fieldErrors?.displayName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onboarding-currency">Moeda padrão</Label>
          <Select name="currency" defaultValue="BRL" disabled={pending}>
            <SelectTrigger id="onboarding-currency">
              <SelectValue placeholder="Moeda" />
            </SelectTrigger>
            <SelectContent position="popper">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrors errors={state?.fieldErrors?.currency} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="onboarding-language">Idioma</Label>
          <Select name="language" defaultValue="pt-BR" disabled={pending}>
            <SelectTrigger id="onboarding-language">
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent position="popper">
              {SUPPORTED_LANGUAGES.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrors errors={state?.fieldErrors?.language} />
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-accent px-3 py-2.5 text-sm">
        <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="leading-relaxed text-accent-foreground">
          Depois disso você entra no dashboard vazio e cadastra a sua primeira conta ou
          movimentação — sem dados de exemplo atribuídos à sua conta.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <ArrowRight aria-hidden />}
        {pending ? "Preparando..." : "Ir para o meu dashboard"}
      </Button>
    </form>
  );
}
