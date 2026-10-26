"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, Send } from "lucide-react";
import { resendConfirmationAction, type AuthFormState } from "@/app/(auth)/actions";
import { FieldErrors, FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResendConfirmationForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resendConfirmationAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.formError ? <FormAlert>{state.formError}</FormAlert> : null}
      {state?.success ? <FormAlert tone="info">{state.info}</FormAlert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="resend-email">E-mail</Label>
        <Input
          id="resend-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={defaultEmail}
          placeholder="voce@exemplo.com"
          disabled={pending}
          aria-invalid={Boolean(state?.fieldErrors?.email) || undefined}
          required
        />
        <FieldErrors errors={state?.fieldErrors?.email} />
      </div>

      <Button type="submit" variant="outline" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Send aria-hidden />
        )}
        {pending ? "Enviando..." : "Reenviar e-mail de confirmação"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já confirmou?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        <MailCheck aria-hidden className="mr-1 inline size-3.5 align-[-2px] text-primary" />
        O link de confirmação expira em alguns minutos — solicite outro se necessário.
      </p>
    </form>
  );
}
