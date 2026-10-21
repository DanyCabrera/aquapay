"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Droplets, House, Pencil, Phone, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { UsuarioComunidad } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageStack, PageBackLink } from "@/components/layout/page-stack";
import { cn } from "@/lib/utils";
import { PRECIO_CHORRO_UNITARIO } from "@/lib/navigation";
import { formatDpi, formatFecha, formatQuetzales, formatRecibo } from "@/lib/format";
import { UsuarioAccionDialog, type UsuarioAccionPendiente } from "@/components/usuarios/usuario-accion-dialog";

export default function UsuarioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const router = useRouter();
  const [data, setData] = useState<UsuarioComunidad | null>(null);
  const [pendiente, setPendiente] = useState<UsuarioAccionPendiente | null>(null);
  const [editarOpen, setEditarOpen] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombreCompleto: "", telefono: "" });
  const [saving, setSaving] = useState<string | null>(null);
  const [editarVivienda, setEditarVivienda] = useState<{ id: string; direccion: string } | null>(null);
  const [errorDireccion, setErrorDireccion] = useState("");
  const [viviendaOpen, setViviendaOpen] = useState(false);
  const [chorroOpen, setChorroOpen] = useState<string | null>(null);
  const [direccion, setDireccion] = useState("");
  const [anioInicio, setAnioInicio] = useState(String(new Date().getFullYear()));
  const [chorroForm, setChorroForm] = useState({
    cantidad: "1",
  });

  async function cargar() {
    try {
      setData(await api<UsuarioComunidad>(`/api/usuarios/${id}`));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
      router.push("/usuarios");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function guardarDireccion(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || saving || !editarVivienda) return;
    const direccionCorregida = editarVivienda.direccion.trim();
    if (direccionCorregida.length < 3 || direccionCorregida.length > 300) return;
    setSaving("direccion");
    setErrorDireccion("");
    try {
      await api(`/api/usuarios/viviendas/${editarVivienda.id}`, {
        method: "PATCH",
        body: JSON.stringify({ direccion: direccionCorregida }),
      });
      setData((actual) => actual ? { ...actual, viviendas: actual.viviendas?.map((v) => v.id === editarVivienda.id ? { ...v, direccion: direccionCorregida } : v) } : actual);
      setEditarVivienda(null);
      toast.success("Dirección actualizada");
    } catch (err) {
      setErrorDireccion(err instanceof ApiError ? err.message : "No se pudo actualizar la dirección.");
    } finally {
      setSaving(null);
    }
  }

  async function crearVivienda(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || saving) return;
    setSaving("vivienda");
    try {
      await api(`/api/usuarios/${id}/viviendas`, {
        method: "POST",
        body: JSON.stringify({
          direccion,
          anioInicioCobro: Number(anioInicio),
        }),
      });
      toast.success("Vivienda registrada");
      setViviendaOpen(false);
      setDireccion("");
      cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    } finally {
      setSaving(null);
    }
  }

  async function crearChorro(e: FormEvent) {
    e.preventDefault();
    if (!chorroOpen || !isAdmin || saving) return;
    setSaving("chorro");
    try {
      const cantidad = Number(chorroForm.cantidad);
      await api(`/api/usuarios/viviendas/${chorroOpen}/chorros`, {
        method: "POST",
        body: JSON.stringify({
          cantidad,
          precioCompra: cantidad * PRECIO_CHORRO_UNITARIO,
        }),
      });
      toast.success("Chorro registrado");
      setChorroOpen(null);
      setChorroForm({ cantidad: "1" });
      cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    } finally {
      setSaving(null);
    }
  }

  async function guardarPerfil(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin || saving) return;
    setSaving("perfil");
    try {
      const updated = await api<UsuarioComunidad>(`/api/usuarios/${id}`, { method: "PATCH", body: JSON.stringify(perfilForm) });
      setData((prev) => prev ? { ...prev, ...updated } : updated);
      setEditarOpen(false);
      toast.success("Datos del beneficiario actualizados");
    } catch (err) { toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el beneficiario."); }
    finally { setSaving(null); }
  }

  async function confirmarAccion({ usuario, accion }: UsuarioAccionPendiente) {
    if (!isAdmin) return;
    if (accion === "eliminar") {
      const data = await api<{ siguiente?: { numeroRecibo: string } }>(
        `/api/usuarios/${usuario.id}?eliminarRecibos=true`,
        { method: "DELETE" },
      );
      toast.success(
        data.siguiente
          ? `Beneficiario eliminado. Siguiente correlativo: ${formatRecibo(data.siguiente.numeroRecibo)}`
          : "Beneficiario eliminado",
      );
      router.push("/usuarios");
    } else {
      const updated = await api<UsuarioComunidad>(`/api/usuarios/${usuario.id}/${accion}`, { method: "POST" });
      setData((prev) => prev ? { ...prev, ...updated } : updated);
      toast.success(accion === "activar" ? "Beneficiario activado" : "Beneficiario desactivado");
    }
  }

  if (!data) {
    return (
      <PageStack>
        <PageBackLink href="/usuarios">Volver a beneficiarios</PageBackLink>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageBackLink href="/usuarios">Volver a beneficiarios</PageBackLink>
      <div className="admin-surface flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2"><span className="rounded-md bg-primary/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Ficha del beneficiario</span><StatusBadge status={data.activo ? "activo" : "inactivo"} /></div>
          <h2 className="text-xl font-semibold tracking-tight">{data.nombreCompleto}</h2>
          <p className="mt-0.5 font-mono text-caption text-muted-foreground">
            {formatDpi(data.dpi)}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-3">
            <Switch
              checked={data.activo}
              onCheckedChange={() => setPendiente({ usuario: data, accion: data.activo ? "desactivar" : "activar" })}
              onLabel="Activo"
              offLabel="Inactivo"
              aria-label={
                data.activo ? "Deshabilitar usuario" : "Habilitar usuario"
              }
            />
            <Button variant="outline" onClick={() => { setPerfilForm({ nombreCompleto: data.nombreCompleto, telefono: data.telefono ?? "" }); setEditarOpen(true); }}><Pencil className="size-4" />Editar datos</Button>
            <Link
              href={`/pagos?dpi=${data.dpi}`}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
            >
              Consultar pago
            </Link>
            <Button variant="outline" onClick={() => setViviendaOpen(true)}>
              Agregar vivienda
            </Button>
            <Button variant="destructive" onClick={() => setPendiente({ usuario: data, accion: "eliminar" })}>
              <Trash2 className="size-4" aria-hidden />
              Eliminar beneficiario
            </Button>
          </div>
        ) : (
          <StatusBadge status={data.activo ? "activo" : "inactivo"} />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: "Teléfono de contacto", value: data.telefono ?? "Sin teléfono registrado", icon: Phone },
        { label: "Fecha de registro", value: formatFecha(data.fechaRegistro), icon: CalendarDays },
        { label: "Viviendas registradas", value: (data.viviendas ?? []).length, icon: House },
        { label: "Chorros registrados", value: (data.viviendas ?? []).reduce((n, v) => n + (v.chorros ?? []).reduce((s, c) => s + c.cantidad, 0), 0), icon: Droplets },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="admin-surface p-5"><div className="mb-3 flex items-center gap-2 text-muted-foreground"><Icon className="size-4" /><p className="text-[11px]">{label}</p></div><p className="text-sm font-semibold">{value}</p></div>)}</div>

      <section>
        <h2 className="mb-3">Viviendas y chorros</h2>
        {(data.viviendas ?? []).length === 0 ? (
          <EmptyState
            title="Sin viviendas"
            action={
              isAdmin ? (
                <Button onClick={() => setViviendaOpen(true)}>
                  Agregar vivienda
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {data.viviendas!.map((v) => (
              <div key={v.id} className="admin-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary"><House className="size-3.5" />Vivienda</p><p className="text-sm font-medium">{v.direccion}</p>
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      Cobro desde{" "}
                      <span className="tabular-nums">{v.anioInicioCobro}</span>
                      {" · "}
                      {v.activa ? "Activa" : "Inactiva"}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={!!saving} onClick={() => { setEditarVivienda({ id: v.id, direccion: v.direccion }); setErrorDireccion(""); }}><Pencil className="size-4" />Editar dirección</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setChorroForm({ cantidad: "1" });
                        setChorroOpen(v.id);
                      }}
                    >
                      Agregar chorro
                    </Button>
                    </div>
                  )}
                </div>
                <ul className="mt-3 divide-y divide-border border-y border-border">
                  {(v.chorros ?? []).map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">
                        <span className="font-mono tabular-nums text-foreground">
                          {c.cantidad}
                        </span>{" "}
                        chorro(s) · Compra{" "}
                        <span className="font-mono tabular-nums">
                          {formatQuetzales(c.precioCompra)}
                        </span>{" "}
                        · Inst.{" "}
                        <span className="font-mono tabular-nums">
                          {formatFecha(c.fechaInstalacion)}
                        </span>
                      </span>
                      <StatusBadge status={c.activo ? "activo" : "inactivo"} />
                    </li>
                  ))}
                  {(v.chorros ?? []).length === 0 && (
                    <li className="py-3 text-sm text-muted-foreground">
                      Sin chorros
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <UsuarioAccionDialog pendiente={pendiente} onClose={() => setPendiente(null)} onConfirm={confirmarAccion} />

      <Dialog open={editarOpen} onOpenChange={(open) => { if (!saving) setEditarOpen(open); }}><DialogContent><DialogHeader><DialogTitle>Editar datos del beneficiario</DialogTitle></DialogHeader><form onSubmit={guardarPerfil} className="space-y-4"><div className="space-y-2"><Label htmlFor="editar-nombre">Nombre completo</Label><Input id="editar-nombre" required minLength={3} maxLength={200} value={perfilForm.nombreCompleto} onChange={(e) => setPerfilForm({ ...perfilForm, nombreCompleto: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="editar-telefono">Teléfono</Label><Input id="editar-telefono" maxLength={30} value={perfilForm.telefono} onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })} /></div><p className="text-xs text-muted-foreground">El DPI no se puede modificar.</p><Button type="submit" disabled={!!saving} className="w-full">{saving === "perfil" ? "Guardando…" : "Guardar cambios"}</Button></form></DialogContent></Dialog>

      <Dialog open={!!editarVivienda} onOpenChange={(open) => { if (!open && !saving) setEditarVivienda(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar dirección de vivienda</DialogTitle></DialogHeader>
          <form onSubmit={guardarDireccion} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="editar-direccion">Dirección</Label><Input id="editar-direccion" value={editarVivienda?.direccion ?? ""} required minLength={3} maxLength={300} disabled={!!saving} onChange={(e) => { const direccion = e.target.value; setEditarVivienda((v) => v ? { ...v, direccion } : v); setErrorDireccion(""); }} aria-invalid={!!errorDireccion} aria-describedby={errorDireccion ? "direccion-error" : undefined} /></div>
            {errorDireccion && <p id="direccion-error" role="alert" className="text-sm text-destructive">{errorDireccion}</p>}
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={!!saving} onClick={() => setEditarVivienda(null)}>Cancelar</Button><Button type="submit" disabled={!!saving || (editarVivienda?.direccion.trim().length ?? 0) < 3}>{saving === "direccion" ? "Guardando…" : "Guardar dirección"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viviendaOpen} onOpenChange={setViviendaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva vivienda</DialogTitle>
          </DialogHeader>
          <form onSubmit={crearVivienda} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nueva-direccion">Dirección</Label>
              <Input
                id="nueva-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nuevo-anio">Año inicio de cobro</Label>
              <Input
                id="nuevo-anio"
                min={2000}
                max={2100}
                className="font-mono"
                type="number"
                value={anioInicio}
                onChange={(e) => setAnioInicio(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!!saving}>
              {saving === "vivienda" ? "Guardando…" : "Guardar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!chorroOpen} onOpenChange={(o) => !o && setChorroOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo chorro</DialogTitle>
          </DialogHeader>
          <form onSubmit={crearChorro} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nuevo-chorro-cantidad">Cantidad de chorros</Label>
              <Input
                id="nuevo-chorro-cantidad"
                type="number"
                min={1}
                value={chorroForm.cantidad}
                onChange={(e) =>
                  setChorroForm({
                    cantidad: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nuevo-chorro-precio">Precio unitario</Label>
              <Input
                id="nuevo-chorro-precio"
                value={formatQuetzales(PRECIO_CHORRO_UNITARIO)}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nuevo-chorro-total">Precio total de compra</Label>
              <Input
                id="nuevo-chorro-total"
                value={formatQuetzales(Number(chorroForm.cantidad) * PRECIO_CHORRO_UNITARIO)}
                readOnly
                className="bg-muted font-semibold"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!!saving}>
              {saving === "chorro" ? "Guardando…" : "Guardar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageStack>
  );
}
