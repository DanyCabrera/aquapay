"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { UsuarioComunidad } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

function initials(nombre: string) {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatFecha(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-GT", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function UsuariosRepoList({
  usuarios,
  className,
}: {
  usuarios: UsuarioComunidad[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card",
        className,
      )}
    >
      <ul className="divide-y divide-border" role="list">
        {usuarios.map((u) => {
          const viviendas = u.viviendas?.length ?? 0;
          return (
            <li key={u.id}>
              <Link
                href={`/usuarios/${u.id}`}
                className="group flex items-center gap-3 px-3 py-2.5 transition-ui hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-medium text-muted-foreground"
                  aria-hidden
                >
                  {initials(u.nombreCompleto)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                      {u.nombreCompleto}
                    </span>
                    <StatusBadge status={u.activo ? "activo" : "inactivo"} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">{u.dpi}</span>
                    <span aria-hidden>·</span>
                    <span className="font-mono tabular-nums">
                      {u.telefono ?? "sin teléfono"}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Home className="size-3 opacity-70" aria-hidden />
                      <span className="font-mono tabular-nums">
                        {viviendas} {viviendas === 1 ? "vivienda" : "viviendas"}
                      </span>
                    </span>
                    {u.fechaRegistro && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="font-mono tabular-nums">
                          desde {formatFecha(u.fechaRegistro)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground opacity-0 transition-ui group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
