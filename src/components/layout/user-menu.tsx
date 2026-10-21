"use client";

import { useRouter } from "next/navigation";
import { Settings, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="gap-2 rounded-full px-1.5"
          aria-label="Abrir menu do usuário"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
              FD
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">Usuário de demonstração</p>
          <p className="text-xs font-normal text-muted-foreground">Perfil de exemplo · Etapa 1</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
          <Settings aria-hidden />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <SunMoon aria-hidden />
          Alternar tema
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-3 py-2 text-[11px] text-muted-foreground">
          Autenticação real será adicionada em uma próxima etapa.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
