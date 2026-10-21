import type { Metadata } from "next";
import { DebtsView } from "@/components/debts/debts-view";

export const metadata: Metadata = { title: "Dívidas" };

export default function DividasPage() {
  return <DebtsView />;
}
