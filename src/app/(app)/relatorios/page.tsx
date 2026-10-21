import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return (
    <ComingSoon
      title="Relatórios"
      description="Análises detalhadas para entender para onde o seu dinheiro está indo."
      features={[
        "Evolução mensal de receitas, despesas e saldo",
        "Comparativos entre períodos e categorias",
        "Relatório de fluxo de caixa por conta",
        "Exportação dos gráficos e tabelas",
      ]}
    />
  );
}
