import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Contas e carteiras" };

export default function ContasECarteirasPage() {
  return (
    <ComingSoon
      title="Contas e carteiras"
      description="Cadastre bancos, carteiras digitais e dinheiro em espécie em um só lugar."
      features={[
        "Cadastro de contas bancárias, cartões e carteiras",
        "Saldos atualizados e saldo consolidado",
        "Transferências entre contas",
        "Conciliação manual com o extrato",
      ]}
    />
  );
}
