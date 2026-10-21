import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Metas" };

export default function MetasPage() {
  return (
    <ComingSoon
      title="Metas"
      description="Transforme objetivos financeiros em planos com prazo e progresso."
      features={[
        "Criação de metas com valor objetivo e prazo",
        "Registro de aportes e acompanhamento do progresso",
        "Estimativa de conclusão com base no seu ritmo",
        "Sugestões automáticas de valor por mês",
      ]}
    />
  );
}
