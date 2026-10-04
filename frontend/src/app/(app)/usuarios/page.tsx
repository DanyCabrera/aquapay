"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UsuarioComunidad } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { formatDpi } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function UsuariosPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const [lista, setLista] = useState<UsuarioComunidad[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function cargar(search?: string) {
    setLoading(true);
    try {
      const path = search?.trim()
        ? `/api/usuarios?q=${encodeURIComponent(search.trim())}`
        : "/api/usuarios";
      setLista(await api<UsuarioComunidad[]>(path));
      setPage(1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtered = useMemo(() => lista, [lista]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function toggleActivo(usuario: UsuarioComunidad) {
    if (!isAdmin) return;
    const next = !usuario.activo;
    const ok = confirm(
      next
        ? `¿Habilitar a ${usuario.nombreCompleto}?`
        : `¿Deshabilitar a ${usuario.nombreCompleto}? No podrá usarse en cobros nuevos.`,
    );
    if (!ok) return;

    setToggling(usuario.id);
    try {
      const updated = await api<UsuarioComunidad>(
        `/api/usuarios/${usuario.id}/${next ? "activar" : "desactivar"}`,
        { method: "POST" },
      );
      setLista((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, ...updated } : u)),
      );
      toast.success(next ? "Usuario habilitado" : "Usuario deshabilitado");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo actualizar el estado",
      );
    } finally {
      setToggling(null);
    }
  }

  return (
    <PageStack>
      <PageIntro
        title="Beneficiarios"
        description="Padrón de la aldea. Abra una ficha para ver o agregar vivienda y chorro."
        action={
          isAdmin ? (
            <Link
              href="/usuarios/nuevo"
              className={cn(buttonVariants(), "rounded-full")}
            >
              <Plus className="size-4" />
              Registrar
            </Link>
          ) : undefined
        }
      />

      <div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            cargar(q);
          }}
        >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 flex-1 rounded-full pl-10"
                placeholder="Nombre o DPI"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar beneficiarios"
              />
            </div>
            <Button type="submit" variant="outline" className="h-10 rounded-full">
              <Search className="size-4" />
              Buscar
            </Button>
          </form>

        {loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-6 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="hidden h-4 w-24 sm:block" />
                <Skeleton className="hidden h-4 flex-1 sm:block" />
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin beneficiarios"
              description="Registre a la persona; la vivienda y el chorro se anotan en el mismo alta."
              action={
                isAdmin ? (
                  <Link href="/usuarios/nuevo">
                    <Button>Registrar</Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-2 overflow-hidden rounded-2xl border border-border">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-caption font-medium text-muted-foreground">
                    <th className="px-5 py-3.5">Nombre</th>
                    <th className="px-5 py-3.5">DPI</th>
                    <th className="px-5 py-3.5">Teléfono</th>
                    <th className="px-5 py-3.5">Dirección</th>
                    <th className="px-5 py-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((u) => {
                    const direccion =
                      u.viviendas?.[0]?.direccion ?? "Sin vivienda";
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-border last:border-b-0 transition-ui hover:bg-muted/40"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/usuarios/${u.id}`}
                            className="font-medium hover:underline"
                          >
                            {u.nombreCompleto}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-caption whitespace-nowrap text-muted-foreground">
                          {formatDpi(u.dpi)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-caption whitespace-nowrap text-muted-foreground">
                          {u.telefono ?? "—"}
                        </td>
                        <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">
                          {direccion}
                        </td>
                        <td className="px-5 py-3.5">
                          {isAdmin ? (
                            <Switch
                              checked={u.activo}
                              disabled={toggling === u.id}
                              onLabel="Activo"
                              offLabel="Inactivo"
                              aria-label={
                                u.activo
                                  ? `Deshabilitar ${u.nombreCompleto}`
                                  : `Habilitar ${u.nombreCompleto}`
                              }
                              onCheckedChange={() => toggleActivo(u)}
                            />
                          ) : (
                            <StatusBadge
                              status={u.activo ? "activo" : "inactivo"}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-caption text-muted-foreground">
                Mostrando {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, filtered.length)} de{" "}
                {filtered.length} beneficiarios.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="min-w-16 text-center text-caption tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </PageStack>
  );
}
