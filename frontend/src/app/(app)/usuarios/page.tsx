"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Droplets, House, Plus, Search, Trash2, Users, UserRoundCheck } from "lucide-react";
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
import { formatDpi, formatFecha, formatRecibo } from "@/lib/format";
import { exportCsv } from "@/lib/export-csv";
import { cn } from "@/lib/utils";
import { UsuarioAccionDialog, type UsuarioAccionPendiente } from "@/components/usuarios/usuario-accion-dialog";

export default function UsuariosPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const [lista, setLista] = useState<UsuarioComunidad[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendiente, setPendiente] = useState<UsuarioAccionPendiente | null>(null);
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState("todos");
  const [orden, setOrden] = useState("nombre");
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  async function cargar(search?: string) {
    setLoading(true);
    setError(null);
    try {
      const path = search?.trim()
        ? `/api/usuarios?q=${encodeURIComponent(search.trim())}`
        : "/api/usuarios";
      setLista(await api<UsuarioComunidad[]>(path));
      setPage(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el padrón.");
      toast.error(err instanceof ApiError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtered = useMemo(() => {
    const result = lista.filter((u) => estado === "todos" || (estado === "activos" ? u.activo : !u.activo));
    return result.sort((a, b) => orden === "recientes" ? b.fechaRegistro.localeCompare(a.fechaRegistro) : orden === "nombre-desc" ? b.nombreCompleto.localeCompare(a.nombreCompleto) : a.nombreCompleto.localeCompare(b.nombreCompleto));
  }, [lista, estado, orden]);
  const viviendas = lista.flatMap((u) => u.viviendas ?? []);
  const chorros = lista.filter((u) => u.activo).flatMap((u) => u.viviendas ?? []).filter((v) => v.activa).reduce((s, v) => s + (v.chorros ?? []).reduce((n, c) => n + (c.activo ? c.cantidad : 0), 0), 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function confirmarAccion({ usuario, accion }: UsuarioAccionPendiente) {
    if (!isAdmin) return;
    if (accion === "eliminar") {
      const data = await api<{ siguiente?: { numeroRecibo: string } }>(
        `/api/usuarios/${usuario.id}?eliminarRecibos=true`,
        { method: "DELETE" },
      );
      setLista((prev) => prev.filter((u) => u.id !== usuario.id));
      setPage((actual) => Math.min(actual, Math.max(1, Math.ceil((filtered.length - 1) / pageSize))));
      toast.success(
        data.siguiente
          ? `Beneficiario eliminado. Siguiente correlativo: ${formatRecibo(data.siguiente.numeroRecibo)}`
          : "Beneficiario eliminado",
      );
    } else {
      const updated = await api<UsuarioComunidad>(
        `/api/usuarios/${usuario.id}/${accion}`,
        { method: "POST" },
      );
      setLista((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, ...updated } : u)),
      );
      toast.success(accion === "activar" ? "Beneficiario activado" : "Beneficiario desactivado");
    }
  }

  return (
    <PageStack>
      <PageIntro
        title="Beneficiarios"
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => exportCsv("beneficiarios-aquapay.csv", ["Nombre", "DPI", "Teléfono", "Dirección", "Estado"], filtered.map((u) => [u.nombreCompleto, u.dpi, u.telefono ?? "", u.viviendas?.map((v) => v.direccion).join("; ") ?? "", u.activo ? "Activo" : "Inactivo"]))} disabled={loading || !filtered.length}><Download className="size-4" />Exportar CSV</Button><Link
              href="/usuarios/nuevo"
              className={cn(buttonVariants(), "rounded-full")}
            >
              <Plus className="size-4" />
              Registrar
            </Link></div>
          ) : undefined
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: "Beneficiarios en la consulta", value: lista.length, icon: Users, color: "text-blue-600 bg-blue-500/10" },
        { label: "Beneficiarios activos", value: lista.filter((u) => u.activo).length, icon: UserRoundCheck, color: "text-emerald-600 bg-emerald-500/10" },
        { label: "Viviendas registradas", value: viviendas.length, icon: House, color: "text-violet-600 bg-violet-500/10" },
        { label: "Chorros activos", value: chorros, icon: Droplets, color: "text-cyan-600 bg-cyan-500/10" },
      ].map(({ label, value, icon: Icon, color }) => <div key={label} className="admin-surface flex items-center gap-4 p-4"><span className={cn("flex size-10 items-center justify-center rounded-xl", color)}><Icon className="size-5" /></span><div><p className="text-2xl font-semibold tabular-nums">{loading || error ? "—" : value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div></div>)}</div>
      {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error} <Button variant="outline" onClick={() => void cargar(q)}>Reintentar</Button></div>}
      <div className="admin-surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-5"><div className="flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1">{[["todos", "Todos"], ["activos", "Activos"], ["inactivos", "Inactivos"]].map(([value, label]) => <button key={value} type="button" aria-pressed={estado === value} className={cn("rounded-lg px-4 py-2 text-xs font-medium transition-ui", estado === value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} onClick={() => { setEstado(value); setPage(1); }}>{label}</button>)}</div><select aria-label="Ordenar beneficiarios" value={orden} onChange={(e) => { setOrden(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-card px-3 py-2 text-xs"><option value="nombre">Nombre: A–Z</option><option value="nombre-desc">Nombre: Z–A</option><option value="recientes">Más recientes</option></select></div>
        <form
          className="flex gap-2 px-5 py-4"
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
        ) : error ? null : pageItems.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={q || estado !== "todos" ? "Sin coincidencias" : "Sin beneficiarios"}
              description={q || estado !== "todos" ? "Sin resultados con estos filtros." : undefined}
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
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-caption font-medium text-muted-foreground">
                    <th className="px-5 py-3.5">Nombre</th>
                    <th className="px-5 py-3.5">DPI</th>
                    <th className="px-5 py-3.5">Teléfono</th>
                    <th className="px-5 py-3.5">Dirección</th>
                    <th className="px-5 py-3.5">Estado</th>
                    {isAdmin && <th className="px-5 py-3.5 text-right">Acciones</th>}
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
                        <td className="min-w-60 px-5 py-3.5">
                          <div className="flex items-center gap-3"><span className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-[11px] font-semibold text-primary sm:flex">{u.nombreCompleto.split(" ").slice(0, 2).map((n) => n[0]).join("")}</span><div><Link
                            href={`/usuarios/${u.id}`}
                            className="font-medium hover:underline"
                          >
                            {u.nombreCompleto}
                          </Link>
                          <p className="mt-1 text-[10px] text-muted-foreground">Desde {formatFecha(u.fechaRegistro)}</p></div></div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-caption whitespace-nowrap text-muted-foreground">
                          {formatDpi(u.dpi)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-caption whitespace-nowrap text-muted-foreground">
                          {u.telefono ?? "—"}
                        </td>
                        <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">
                          <span title={direccion}>{direccion}</span><p className="mt-1 text-[10px] text-muted-foreground">{u.viviendas?.length ?? 0} viviendas · {(u.viviendas ?? []).reduce((s, v) => s + (v.chorros ?? []).reduce((n, c) => n + c.cantidad, 0), 0)} chorros</p>
                        </td>
                        <td className="px-5 py-3.5">
                          {isAdmin ? (
                            <div className="flex items-center gap-2"><Switch
                              checked={u.activo}
                              onLabel="Activo"
                              offLabel="Inactivo"
                              aria-label={
                                u.activo
                                  ? `Deshabilitar ${u.nombreCompleto}`
                                  : `Habilitar ${u.nombreCompleto}`
                              }
                              onCheckedChange={() => setPendiente({ usuario: u, accion: u.activo ? "desactivar" : "activar" })}
                            />
                            <span className={cn("text-[10px] font-medium", u.activo ? "text-emerald-600" : "text-muted-foreground")}>{u.activo ? "Activo" : "Inactivo"}</span></div>
                          ) : (
                            <StatusBadge
                              status={u.activo ? "activo" : "inactivo"}
                            />
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5 text-right">
                            <Button variant="destructive" size="sm" aria-label={`Eliminar ${u.nombreCompleto}`} onClick={() => setPendiente({ usuario: u, accion: "eliminar" })}>
                              <Trash2 className="size-4" aria-hidden />
                              Eliminar
                            </Button>
                          </td>
                        )}
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
      <UsuarioAccionDialog pendiente={pendiente} onClose={() => setPendiente(null)} onConfirm={confirmarAccion} />
    </PageStack>
  );
}
