"use client";

import { formatCurrency } from "@/lib/format";
import { cn } from "cn";

export type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    name?: string;
    value?: unknown;
    color?: string;
  }>;
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label !== undefined && (
        <p className="mb-1.5 font-medium text-muted-foreground">{label}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={entry.name ?? index} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {typeof entry.value === "number"
                ? formatCurrency(entry.value)
                : cn(String(entry.value ?? ""))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
