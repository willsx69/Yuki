import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { demoGoal, type DemoGoal } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

type GoalProgressProps = {
  goal?: DemoGoal;
};

export function GoalProgress({ goal = demoGoal }: GoalProgressProps) {
  const progress = Math.min(100, Math.round((goal.valorAtual / goal.valorObjetivo) * 100));
  const restante = Math.max(0, goal.valorObjetivo - goal.valorAtual);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meta financeira</CardTitle>
        <p className="text-xs text-muted-foreground">Progresso do objetivo selecionado · dados de exemplo</p>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Target aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{goal.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{goal.descricao}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted-foreground">Acumulado</p>
            <p className="text-xs font-medium tabular-nums text-foreground">
              {formatCurrency(goal.valorAtual)}{" "}
              <span className="text-muted-foreground">de {formatCurrency(goal.valorObjetivo)}</span>
            </p>
          </div>
          <Progress value={progress} aria-label={`Progresso da meta: ${progress}%`} />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{progress}% concluída</span>
            <span>Faltam {formatCurrency(restante)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Prazo estimado: {goal.prazo}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/metas">
            Ver todas as metas
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
