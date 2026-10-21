"use client";

import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-dvh bg-background"
      style={{ "--sidebar-w": collapsed ? "4.75rem" : "16.5rem" } as React.CSSProperties}
    >
      <a
        href="#conteudo"
        className="sr-only rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Pular para o conteúdo
      </a>

      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-h-dvh flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--sidebar-w)]">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main
          id="conteudo"
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
