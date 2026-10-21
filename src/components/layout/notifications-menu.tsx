"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { demoNotifications } from "@/lib/demo-data";

export function NotificationsMenu() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const unreadCount = demoNotifications.filter((item) => !readIds.includes(item.id)).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={
            unreadCount > 0
              ? `Notificações (${unreadCount} não lidas)`
              : "Notificações (nenhuma não lida)"
          }
          className="relative"
        >
          <Bell aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between gap-2 pr-2">
          <DropdownMenuLabel className="text-sm">Notificações</DropdownMenuLabel>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={unreadCount === 0}
            onClick={() => setReadIds(demoNotifications.map((item) => item.id))}
          >
            Marcar todas como lidas
          </Button>
        </div>
        <DropdownMenuSeparator />
        <ul className="max-h-80 overflow-y-auto p-1">
          {demoNotifications.map((item) => {
            const unread = !readIds.includes(item.id);
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-muted/60"
              >
                <span
                  aria-hidden
                  className={
                    unread
                      ? "mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      : "mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/30"
                  }
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {item.titulo}
                    {unread && <span className="sr-only"> (não lida)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.detalhe}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <DropdownMenuSeparator />
        <p className="px-3 py-2 text-[11px] text-muted-foreground">
          Exemplos de notificação para demonstração da interface.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
