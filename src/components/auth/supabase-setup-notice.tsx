import { AlertTriangle } from "lucide-react";

/**
 * Aviso exibido nas páginas públicas quando o Supabase ainda não foi
 * configurado (variáveis de ambiente ausentes). Deixa claro que a conta,
 * a sessão e o isolamento por usuário dependem dessa configuração.
 */
export function SupabaseSetupNotice() {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="leading-relaxed">
        O Supabase ainda não está configurado neste ambiente, então login e cadastro
        estão indisponíveis. Defina <code className="font-medium">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        e <code className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no{" "}
        <code className="font-medium">.env.local</code> e aplique as migrações de{" "}
        <code className="font-medium">supabase/migrations/</code> — instruções no README.
      </p>
    </div>
  );
}
