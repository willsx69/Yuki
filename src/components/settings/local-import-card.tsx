"use client";

import { useSyncExternalStore, useState } from "react";
import { Database, Loader2, MoveRight } from "lucide-react";
import { FormAlert } from "@/components/auth/form-alert";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { hasLocalDataToImport, importLocalData } from "@/lib/migration/local-import";

type ImportCardProps = {
  /** Exibido apenas quando há Supabase configurado e usuário autenticado. */
  supabaseConfigured: boolean;
};

function subscribeToLocalStorage() {
  return () => {};
}

/**
 * Importação explícita dos dados do navegador (Etapa 2, localStorage) para
 * a conta autenticada. Nada migra sozinho — o usuário aciona e confirma.
 */
export function LocalImportCard({ supabaseConfigured }: ImportCardProps) {
  const { user } = useAuthContext();
  const [imported, setImported] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  const hasLocalData = useSyncExternalStore(
    subscribeToLocalStorage,
    () => hasLocalDataToImport(),
    () => false,
  );

  if (!supabaseConfigured || !user || imported || !hasLocalData) return null;

  async function handleImport() {
    setPending(true);
    setMessage(null);
    try {
      const summary = await importLocalData();
      setMessage({
        tone: "info",
        text: `Importação concluída: ${summary.transactions} transação(ões), ${summary.bills} conta(s) e ${summary.debts} dívida(s) agora pertencem à sua conta.`,
      });
      setImported(true);
      setConfirming(false);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Não foi possível importar os dados.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg bg-muted/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Database aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Dados deste navegador</p>
            <p className="text-xs text-muted-foreground">
              Encontramos lançamentos salvos localmente (modo sem login). Importe-os para a
              sua conta — a ação é manual e os dados locais não são apagados.
            </p>
          </div>
        </div>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleImport} disabled={pending}>
              {pending ? (
                <Loader2 aria-hidden className="animate-spin" />
              ) : (
                <MoveRight aria-hidden />
              )}
              {pending ? "Importando..." : "Sim, importar"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setConfirming(true)}
          >
            Importar para a minha conta
          </Button>
        )}
      </div>

      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}
    </div>
  );
}
