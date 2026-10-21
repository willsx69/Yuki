import type { Metadata } from "next";
import { BillsView } from "@/components/bills/bills-view";

export const metadata: Metadata = { title: "Contas a pagar" };

export default function ContasAPagarPage() {
  return <BillsView type="payable" />;
}
