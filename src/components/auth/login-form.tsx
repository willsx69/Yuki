"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { signInAction, type AuthFormState } from "@/app/(auth)/actions";
import { FieldErrors, FormAlert } from "@/components/auth/form-alert";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signInAction,
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

      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-1.5">
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
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

      <div className="space-y-1.5">
        <PasswordField
          id="login-password"
          name="password"
          label="Senha"
          autoComplete="current-password"
          placeholder="Sua senha"
          disabled={pending}
          invalid={Boolean(state?.fieldErrors?.password)}
        />
        <FieldErrors errors={state?.fieldErrors?.password} />
        <div className="pt-1">
          <Link
            href="/recuperar-senha"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <LogIn aria-hidden />
        )}
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
