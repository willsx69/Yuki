import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Selos usados para deixar claro que os dados exibidos são de demonstração. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      title="Valores fictícios usados apenas para ilustrar a interface"
      className={className}
    >
      <Info aria-hidden />
      Dados de exemplo
    </Badge>
  );
}
