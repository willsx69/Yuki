"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, SunMoon } from "lucide-react";
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
import { useAuthContext } from "@/components/providers/auth-provider";
import { initialsOf } from "@/lib/profile/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function UserMenu() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuthContext();

  const displayName = profile?.displayName || user?.email || "Usuário";
  const subtitle = user?.email ?? "Modo local · sem login";
  const initials = initialsOf(profile?.displayName ?? user?.email ?? "Yuki");

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
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{subtitle}</p>
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
        {user ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut aria-hidden />
              Sair da conta
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <p className="px-3 py-2 text-[11px] text-muted-foreground">
              {isSupabaseConfigured()
                ? "Sessão não encontrada. Entre para usar sua conta."
                : "Modo local: sem Supabase configurado, os dados ficam neste navegador."}
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
