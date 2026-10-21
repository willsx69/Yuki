"use client";

import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo-mark";
import { NavList } from "@/components/layout/nav-list";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type MobileSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showCloseButton={false} className="w-72 gap-0 p-0">
        <SheetHeader className="flex h-16 flex-row items-center gap-2.5 border-b pr-14 pl-4 text-left">
          <LogoMark />
          <div>
            <SheetTitle className="text-base">Yuki</SheetTitle>
            <SheetDescription className="text-[11px]">Controle de gastos</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3"
            aria-label="Fechar menu"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden />
          </Button>
        </SheetHeader>
        <NavList
          onNavigate={() => onOpenChange(false)}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
        />
        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Ambiente de demonstração. Os valores exibidos são fictícios.
          </p>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
