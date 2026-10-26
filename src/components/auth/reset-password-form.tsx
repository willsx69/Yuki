"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { resetPasswordAction, type AuthFormState } from "@/app/(auth)/actions";
import { FieldErrors, FormAlert } from "@/components/auth/form-alert";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
    if (state?.redirectTo && !state.success) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.formError ? <FormAlert>{state.formError}</FormAlert> : null}

      <PasswordField
        id="reset-password"
        name="password"
        label="Nova senha"
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres, com letra e número"
        disabled={pending}
        invalid={Boolean(state?.fieldErrors?.password)}
      />
      <FieldErrors errors={state?.fieldErrors?.password} />

      <PasswordField
        id="reset-confirm-password"
        name="confirmPassword"
        label="Confirmar nova senha"
        autoComplete="new-password"
        placeholder="Digite a nova senha novamente"
        disabled={pending}
        invalid={Boolean(state?.fieldErrors?.confirmPassword)}
      />
      <FieldErrors errors={state?.fieldErrors?.confirmPassword} />

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <KeyRound aria-hidden />
        )}
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
