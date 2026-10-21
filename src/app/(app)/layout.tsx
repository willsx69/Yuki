import { AppShell } from "@/components/layout/app-shell";
import { BillsProvider } from "@/components/providers/bills-provider";
import { DebtsProvider } from "@/components/providers/debts-provider";
import { TransactionsProvider } from "@/components/providers/transactions-provider";

export default function AppAreaLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionsProvider>
      <BillsProvider>
        <DebtsProvider>
          <AppShell>{children}</AppShell>
        </DebtsProvider>
      </BillsProvider>
    </TransactionsProvider>
  );
}
