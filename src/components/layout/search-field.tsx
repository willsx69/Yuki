"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { navItems } from "@/lib/nav";
import { cn } from "cn";

export function SearchField({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return navItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          item.keywords.some((keyword) => keyword.includes(term)),
      )
      .slice(0, 5);
  }, [query]);

  function goTo(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
  }

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        role="searchbox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            setOpen(false);
          }
          if (event.key === "Enter" && results[0]) {
            event.preventDefault();
            goTo(results[0].href);
          }
        }}
        placeholder="Buscar páginas"
        aria-label="Buscar páginas do Yuki"
        className="pr-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none lg:pr-8"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none lg:size-6"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}

      {open && query.trim() !== "" && (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
          {results.length > 0 ? (
            <ul className="p-1">
              {results.map((item) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goTo(item.href)}
                    className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    <item.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhuma página encontrada para “{query.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
