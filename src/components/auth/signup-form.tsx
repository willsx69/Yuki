"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { signUpAction, type AuthFormState } from "@/app/(auth)/actions";
import { FieldErrors, FormAlert } from "@/components/auth/form-alert";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.formError ? <FormAlert>{state.formError}</FormAlert> : null}
      {state?.success && state.needsEmailConfirmation ? (
        <FormAlert tone="info">
          Quase lá! Enviamos um e-mail de confirmação. Abra o link para ativar a conta.
        </FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Nome completo</Label>
        <Input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Como você quer ser chamado"
          disabled={pending}
          aria-invalid={Boolean(state?.fieldErrors?.name) || undefined}
          required
        />
        <FieldErrors errors={state?.fieldErrors?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          disabled={pending}
          aria-invalid={Boolean(state?.fieldErrors?.email) || undefined}
          required
        />
        <FieldErrors errors={state?.fieldErrors?.email} />
      </div>

      <PasswordField
        id="signup-password"
        name="password"
        label="Senha"
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres, com letra e número"
        disabled={pending}
        invalid={Boolean(state?.fieldErrors?.password)}
      />
      <FieldErrors errors={state?.fieldErrors?.password} />

      <PasswordField
        id="signup-confirm-password"
        name="confirmPassword"
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Digite a senha novamente"
        disabled={pending}
        invalid={Boolean(state?.fieldErrors?.confirmPassword)}
      />
      <FieldErrors errors={state?.fieldErrors?.confirmPassword} />

      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            disabled={pending}
            aria-invalid={Boolean(state?.fieldErrors?.terms) || undefined}
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="leading-relaxed">
            Li e aceito os Termos de Uso e a Política de Privacidade do Yuki.
          </span>
        </label>
        <FieldErrors errors={state?.fieldErrors?.terms} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <UserPlus aria-hidden />
        )}
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
