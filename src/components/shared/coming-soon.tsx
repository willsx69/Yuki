import { CheckCircle2, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ComingSoonProps = {
  /** Título curto da funcionalidade planejada. */
  title: string;
  description: string;
  /** Lista do que será implementado nesta página nas próximas etapas. */
  features: string[];
};

export function ComingSoon({ title, description, features }: ComingSoonProps) {
  return (
    <Card>
      <CardContent className="items-center gap-5 py-12 text-center sm:py-16">
        <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Construction aria-hidden className="size-6" />
        </span>

        <div className="flex flex-col items-center gap-2">
          <Badge variant="secondary">Em desenvolvimento</Badge>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="w-full max-w-md rounded-xl bg-muted/60 p-4 text-left">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            O que virá nesta página
          </p>
          <ul className="space-y-1.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          O layout, a navegação e o tema já estão prontos — apenas a lógica financeira será
          adicionada nas próximas etapas.
        </p>
      </CardContent>
    </Card>
  );
}
