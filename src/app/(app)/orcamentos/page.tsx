import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Orçamentos" };

export default function OrcamentosPage() {
  return (
    <ComingSoon
      title="Orçamentos"
      description="Defina limites mensais por categoria e acompanhe o uso em tempo real."
      features={[
        "Criação de orçamentos por categoria e período",
        "Barra de consumo com alertas de proximidade do limite",
        "Reajuste automático do orçamento mês a mês",
        "Comparação entre orçado e realizado",
      ]}
    />
  );
}
