import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "cn";

type SummaryCardProps = {
  label: string;
  amount: number;
  hint?: string;
  icon: LucideIcon;
  /** Valor exibido ao lado do valor principal (variação, contagem etc.). */
  trend?: { direction: "up" | "down"; label: string; tone?: "positive" | "negative" };
  /** Controla a cor do valor: padrão, positivo (receita) ou negativo (despesa). */
  tone?: "default" | "positive" | "negative";
};

export function SummaryCard({
  label,
  amount,
  hint,
  icon: Icon,
  trend,
  tone = "default",
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon aria-hidden className="size-5" />
          </div>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                (trend.tone ?? trend.direction) === "positive"
                  ? "text-primary"
                  : "text-destructive",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight aria-hidden className="size-3.5" />
              ) : (
                <ArrowDownRight aria-hidden className="size-3.5" />
              )}
              {trend.label}
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
              tone === "positive" && "text-primary",
              tone === "negative" && "text-destructive",
            )}
          >
            {formatCurrency(amount)}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
