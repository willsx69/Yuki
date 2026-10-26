import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetupGate } from "@/components/auth/setup-gate";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar conta"
      description="Cadastre-se para organizar as suas finanças com privacidade."
    >
      <SetupGate>
        <SignupForm />
      </SetupGate>
    </AuthShell>
  );
}
