"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/layout/search-field";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { findNavItem } from "@/lib/nav";

type HeaderProps = {
  onOpenMobileMenu: () => void;
};

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const item = findNavItem(pathname);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu de navegação"
        >
          <Menu aria-hidden />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {item.label}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        </div>

        <SearchField className="hidden w-56 lg:block xl:w-72" />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileSearchOpen((open) => !open)}
          aria-label="Buscar páginas"
          aria-expanded={mobileSearchOpen}
        >
          <Search aria-hidden />
        </Button>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <NotificationsMenu />
          {/* No celular o tema é alternado pelo menu do usuário / gaveta de navegação. */}
          <ThemeToggle className="max-sm:hidden" />
          <UserMenu />
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-border px-4 py-3 sm:px-6 lg:hidden">
          <SearchField />
        </div>
      )}
    </header>
  );
}
