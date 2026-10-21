"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navSections, type NavItem } from "@/lib/nav";

type NavListProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
};

function NavItemLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/60",
        "lg:min-h-9 lg:py-2",
        collapsed && "justify-center px-2",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function NavList({ collapsed = false, onNavigate, className }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className={cn("space-y-5", className)}>
      {navSections.map((section) => (
        <div key={section.title}>
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {section.title}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavItemLink
                  item={item}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
