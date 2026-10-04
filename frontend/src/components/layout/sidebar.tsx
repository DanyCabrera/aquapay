"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  LogOut,
  Menu,
  PanelLeft,
  Rocket,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { linksForRole } from "@/lib/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const links = linksForRole(user?.rol);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return links;
    return links.filter((l) => l.label.toLowerCase().includes(t));
  }, [links, q]);

  const principales = filtrados.filter((l) =>
    ["/dashboard", "/usuarios", "/facturacion", "/historial", "/pagos"].includes(
      l.href,
    ),
  );
  const herramientas = filtrados.filter((l) =>
    ["/reportes", "/configuracion"].includes(l.href),
  );

  function estaActivo(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const cta =
    user?.rol === "tesorero"
      ? { href: "/facturacion", label: "Emitir recibo" }
      : { href: "/usuarios/nuevo", label: "Registrar" };

  function NavBody() {
    return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center py-4",
          collapsed ? "flex-col gap-2 px-2" : "justify-between gap-2 px-3",
        )}
      >
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <BrandMark collapsed={collapsed} />
        </Link>
        <button
          type="button"
          className="hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-ui hover:bg-muted active:scale-95 lg:inline-flex"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-ui hover:bg-muted active:scale-95 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className={cn("px-3 pb-3", collapsed && "hidden")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 rounded-xl border-border bg-muted/70 pl-9 text-xs"
            placeholder="Filtrar menú"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filtrar el menú"
          />
        </div>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pb-3"
        aria-label="Principal"
      >
        <NavSection title="Menú" collapsed={collapsed}>
          {principales.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={estaActivo(link.href)}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </NavSection>

        {herramientas.length > 0 ? (
          <NavSection title="Herramientas" collapsed={collapsed}>
            {herramientas.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={estaActivo(link.href)}
                collapsed={collapsed}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </NavSection>
        ) : null}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-border p-3">
        {collapsed ? (
          <Link
            href={cta.href}
            onClick={() => setMobileOpen(false)}
            className="mx-auto flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-ui active:scale-95"
            aria-label={cta.label}
          >
            <Rocket className="size-4" />
          </Link>
        ) : (
          <Link
            href={cta.href}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-2xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-ui active:scale-[0.98]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Rocket className="size-3.5" />
            </span>
            {cta.label}
          </Link>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className={cn(
            "flex h-10 w-full items-center rounded-xl text-sm text-muted-foreground transition-ui hover:bg-muted hover:text-foreground active:scale-[0.98]",
            collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {collapsed ? null : "Salir"}
        </button>
      </div>
    </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <BrandMark />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border transition-ui active:scale-95"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-foreground/30 transition-opacity duration-300 ease-out-quart",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="Cerrar menú"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "relative z-10 flex h-full w-65 flex-col bg-sidebar shadow-xl transition-transform duration-300 ease-out-quart",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <NavBody />
        </aside>
      </div>

      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out-quart lg:flex",
          collapsed ? "w-18" : "w-60",
        )}
      >
        <NavBody />
      </aside>
    </>
  );
}

function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {collapsed ? null : (
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex min-h-10 items-center rounded-xl text-sm transition-ui active:scale-[0.98]",
        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {active && !collapsed ? (
        <span className="absolute left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className="size-4 shrink-0" />
      {collapsed ? null : (
        <span className={cn(active && "pl-0.5")}>{label}</span>
      )}
    </Link>
  );
}

export function ContentHeader({
  title,
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  const { user } = useAuth();
  const iniciales = (user?.nombre ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card px-5 py-3.5 sm:px-8">
      <h1 className="min-w-0 truncate">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
        <span
          className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold"
          title={user?.nombre}
        >
          {iniciales}
        </span>
      </div>
    </header>
  );
}
