"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { linksForRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const subtitulos: Record<string, string> = {
  administrador: "Administración",
  tesorero: "Tesorería",
};

/**
 * Barra única para ambos roles. Va a ancho completo y en pizarra profunda: es
 * el único elemento oscuro de la pantalla, así que ancla la página sin competir
 * con el contenido. Lo que cambia entre roles son los enlaces, no el armazón.
 */
export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const links = linksForRole(user?.rol);

  function estaActivo(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="shrink-0 rounded-md">
          <BrandMark subtitle={subtitulos[user?.rol ?? ""] ?? undefined} />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Principal"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={estaActivo(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-ui",
                estaActivo(link.href)
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-white/8 hover:text-sidebar-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[0.8125rem] leading-tight font-medium">
              {user?.nombre}
            </p>
            <p className="text-[0.75rem] leading-tight capitalize opacity-60">
              {user?.rol}
            </p>
          </div>
          <ThemeToggle compact className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => logout()}
            className="hidden h-8 rounded-md border border-current/25 px-3 text-[0.8125rem] opacity-75 transition-ui hover:opacity-100 md:inline-flex md:items-center"
          >
            Salir
          </button>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
            className="inline-flex size-9 items-center justify-center rounded-md border border-current/25 opacity-80 transition-ui hover:opacity-100 md:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 space-y-1 px-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setAbierto(false)}
                className={cn(
                  "block rounded-md px-3 py-2.5 text-sm transition-ui",
                  estaActivo(link.href)
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-1 pt-4">
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => logout()}
            >
              Cerrar sesión
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
