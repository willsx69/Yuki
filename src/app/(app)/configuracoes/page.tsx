import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
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

      <ComingSoon
        title="Demais configurações"
        description="Perfil, categorias padrão e preferências de notificação serão adicionados nas próximas etapas."
        features={[
          "Edição de nome, e-mail e foto do perfil",
          "Criação e organização de categorias",
          "Preferências de notificação e alertas",
          "Definição de moeda, start do mês e formato de data",
        ]}
      />
    </div>
  );
}
