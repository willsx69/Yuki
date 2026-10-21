import type { Metadata } from "next";
import { BillsView } from "@/components/bills/bills-view";

export const metadata: Metadata = { title: "Contas a receber" };

export default function ContasAReceberPage() {
  return <BillsView type="receivable" />;
}
