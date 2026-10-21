import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Cartões" };

export default function CartoesPage() {
  return (
    <ComingSoon
      title="Cartões"
      description="Gerencie cartões de crédito, faturas abertas e limites disponíveis."
      features={[
        "Cadastro dos cartões com fechamento e vencimento",
        "Fatura atual, fatura futura e limite disponível",
        "Lançamentos vinculados ao cartão selecionado",
        "Alertas de fatura próxima do limite",
      ]}
    />
  );
}
