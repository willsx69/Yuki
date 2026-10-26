"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, Send } from "lucide-react";
import { recoverPasswordAction, type AuthFormState } from "@/app/(auth)/actions";
import { FieldErrors, FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecoverPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    recoverPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.formError ? <FormAlert>{state.formError}</FormAlert> : null}
      {state?.success ? (
        <FormAlert tone="info">
          <span className="flex items-start gap-2">
            <MailCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{state.info}</span>
          </span>
        </FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="recover-email">E-mail</Label>
        <Input
          id="recover-email"
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

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Send aria-hidden />
        )}
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
