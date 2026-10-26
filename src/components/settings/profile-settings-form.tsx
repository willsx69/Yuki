"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2, Save } from "lucide-react";
import { updateProfileAction, type ProfileFormState } from "@/app/(app)/configuracoes/actions";
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

/** Formulário de perfil e preferências (dentro de Configurações). */
export function ProfileSettingsForm() {
  const { profile, user, refreshProfile } = useAuthContext();
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      void refreshProfile();
    }
  }, [state, refreshProfile]);

  if (!user) {
    return (
      <FormAlert tone="info">
        Você está no modo local (sem login). Configure o Supabase para ter uma conta
        própria e sincronizar o perfil na nuvem.
      </FormAlert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.formError ? <FormAlert>{state.formError}</FormAlert> : null}
      {state?.success ? (
        <FormAlert tone="info">
          <span className="flex items-center gap-2">
            <Check aria-hidden className="size-4 shrink-0 text-primary" />
            Perfil atualizado com sucesso.
          </span>
        </FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Nome de exibição</Label>
        <Input
          id="profile-name"
          name="displayName"
          type="text"
          autoComplete="name"
          defaultValue={profile?.displayName ?? ""}
          placeholder="Como você quer ser chamado"
          disabled={pending}
          aria-invalid={Boolean(state?.fieldErrors?.displayName) || undefined}
          required
        />
        <FieldErrors errors={state?.fieldErrors?.displayName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-currency">Moeda preferencial</Label>
          <Select name="currency" defaultValue={profile?.currency ?? "BRL"} disabled={pending}>
            <SelectTrigger id="profile-currency" aria-invalid={Boolean(state?.fieldErrors?.currency) || undefined}>
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
          <Label htmlFor="profile-language">Idioma</Label>
          <Select name="language" defaultValue={profile?.language ?? "pt-BR"} disabled={pending}>
            <SelectTrigger id="profile-language" aria-invalid={Boolean(state?.fieldErrors?.language) || undefined}>
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

      <div className="space-y-1.5">
        <Label htmlFor="profile-email">E-mail da conta</Label>
        <Input
          id="profile-email"
          type="email"
          value={user.email ?? ""}
          disabled
          aria-readonly
          className="opacity-70"
        />
        <p className="text-xs text-muted-foreground">
          O e-mail é gerenciado pelo Supabase Auth e não é editável nesta tela.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-muted/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Senha de acesso</p>
            <p className="text-xs text-muted-foreground">
              Alteração por link seguro enviado ao seu e-mail.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/recuperar-senha">Redefinir senha</Link>
        </Button>
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
