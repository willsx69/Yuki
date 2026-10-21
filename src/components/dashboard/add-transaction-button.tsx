"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";

export function AddTransactionButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="lg" className={className} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Adicionar transação
      </Button>
      <TransactionFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
