import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RecoverPasswordForm } from "@/components/auth/recover-password-form";
import { SetupGate } from "@/components/auth/setup-gate";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPasswordPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      description="Informe o e-mail da conta e enviaremos um link para criar uma nova senha."
    >
      <SetupGate>
        <RecoverPasswordForm />
      </SetupGate>
    </AuthShell>
  );
}
