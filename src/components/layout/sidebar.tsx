"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogoMark } from "@/components/layout/logo-mark";
import { NavList } from "@/components/layout/nav-list";
import { cn } from "cn";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      aria-label="Barra lateral"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w)] flex-col border-r border-sidebar-border bg-sidebar",
        "transition-[width] duration-200 ease-out lg:flex",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <LogoMark />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-sidebar-foreground">
              Yuki
            </p>
            <p className="truncate text-[11px] text-muted-foreground">Controle de gastos</p>
          </div>
        )}
      </div>

      <NavList collapsed={collapsed} className="flex-1 overflow-y-auto px-3 py-4" />

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <p className="px-1 pb-3 text-[11px] leading-relaxed text-muted-foreground">
            Ambiente de demonstração. Os valores exibidos são fictícios.
          </p>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
              className={cn("w-full justify-center text-muted-foreground", collapsed && "px-2")}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden />
              ) : (
                <>
                  <PanelLeftClose aria-hidden />
                  <span>Recolher menu</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Expandir menu</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}
