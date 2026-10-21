"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { useIsNarrowScreen } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/format";

export type CategoryExpensePoint = {
  nome: string;
  valor: number;
};

type CategoryExpenseChartProps = {
  data: CategoryExpensePoint[];
};

export function CategoryExpenseChart({ data }: CategoryExpenseChartProps) {
  const narrow = useIsNarrowScreen();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="valor"
            nameKey="nome"
            innerRadius={narrow ? 44 : 58}
            outerRadius={narrow ? 66 : 88}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={entry.nome} fill={`var(--chart-${(index % 6) + 1})`} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            layout={narrow ? "horizontal" : "vertical"}
            align={narrow ? "center" : "right"}
            verticalAlign={narrow ? "bottom" : "middle"}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <span className="sr-only">
        Total de despesas por categoria: {formatCurrency(
          data.reduce((total, item) => total + item.valor, 0),
        )}
      </span>
    </div>
  );
}
