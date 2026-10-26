import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocalImportCard } from "@/components/settings/local-import-card";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Perfil e preferências</CardTitle>
          <CardDescription>
            Seus dados de exibição e preferências. E-mail e senha são gerenciados com
            segurança pelo sistema de autenticação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <p className="text-xs text-muted-foreground">
            Preferência aplicada neste dispositivo e salva no navegador.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Tema do aplicativo</p>
              <p className="text-xs text-muted-foreground">
                Alterne entre o tema claro e o tema escuro do Yuki.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <LocalImportCard supabaseConfigured={supabaseConfigured} />
    </div>
  );
}
