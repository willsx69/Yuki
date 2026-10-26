import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseSetupNotice } from "@/components/auth/supabase-setup-notice";

/**
 * Exibe o aviso de configuração pendente quando o Supabase não está
 * definido no ambiente; caso contrário, apenas repassa o conteúdo.
 */
export function SetupGate({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <SupabaseSetupNotice />
        {children}
      </>
    );
  }
  return <>{children}</>;
}
