"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { useIsNarrowScreen } from "@/hooks/use-media-query";
import { formatCompactCurrency } from "@/lib/format";

export type IncomeExpensePoint = {
  mes: string;
  receitas: number;
  despesas: number;
};

type IncomeExpenseChartProps = {
  data: IncomeExpensePoint[];
};

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const narrow = useIsNarrowScreen();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: narrow ? 0 : 8, bottom: 0, left: 0 }}
          barGap={narrow ? 4 : 8}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: narrow ? 11 : 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={narrow ? 48 : 72}
            tickFormatter={formatCompactCurrency}
            tick={{ fontSize: narrow ? 11 : 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)", opacity: 0.6 }}
            content={<ChartTooltip />}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
          <Bar dataKey="receitas" name="Receitas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="despesas" name="Despesas" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
