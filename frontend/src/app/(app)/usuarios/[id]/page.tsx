"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { formatDpi, formatFecha, formatQuetzales } from "@/lib/format";

export default function UsuarioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const router = useRouter();
  const [data, setData] = useState<UsuarioComunidad | null>(null);
  const [viviendaOpen, setViviendaOpen] = useState(false);
  const [chorroOpen, setChorroOpen] = useState<string | null>(null);
  const [direccion, setDireccion] = useState("");
  const [anioInicio, setAnioInicio] = useState(new Date().getFullYear());
  const [chorroForm, setChorroForm] = useState({
    cantidad: 1,
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

  async function crearVivienda(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await api(`/api/usuarios/${id}/viviendas`, {
        method: "POST",
        body: JSON.stringify({
          direccion,
          anioInicioCobro: anioInicio,
        }),
      });
      toast.success("Vivienda registrada");
      setViviendaOpen(false);
      setDireccion("");
      cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    }
  }

  async function crearChorro(e: FormEvent) {
    e.preventDefault();
    if (!chorroOpen || !isAdmin) return;
    try {
      const cantidad = Math.max(1, chorroForm.cantidad);
      await api(`/api/usuarios/viviendas/${chorroOpen}/chorros`, {
        method: "POST",
        body: JSON.stringify({
          cantidad,
          precioCompra: cantidad * PRECIO_CHORRO_UNITARIO,
        }),
      });
      toast.success("Chorro registrado");
      setChorroOpen(null);
      setChorroForm({ cantidad: 1 });
      cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    }
  }

  async function desactivar() {
    if (!confirm("¿Desactivar este usuario?")) return;
    try {
      await api(`/api/usuarios/${id}/desactivar`, { method: "POST" });
      toast.success("Usuario desactivado");
      cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    }
  }

  async function activar() {
    if (!confirm("¿Habilitar este usuario?")) return;
    try {
      await api(`/api/usuarios/${id}/activar`, { method: "POST" });
      toast.success("Usuario habilitado");
      cargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    }
  }

  async function toggleActivo() {
    if (data?.activo) await desactivar();
    else await activar();
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2>{data.nombreCompleto}</h2>
          <p className="mt-0.5 font-mono text-caption text-muted-foreground">
            {formatDpi(data.dpi)}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-3">
            <Switch
              checked={data.activo}
              onCheckedChange={() => toggleActivo()}
              onLabel="Activo"
              offLabel="Inactivo"
              aria-label={
                data.activo ? "Deshabilitar usuario" : "Habilitar usuario"
              }
            />
            <Link
              href={`/pagos?dpi=${data.dpi}`}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
            >
              Consultar pago
            </Link>
            <Button variant="outline" onClick={() => setViviendaOpen(true)}>
              Agregar vivienda
            </Button>
          </div>
        ) : (
          <StatusBadge status={data.activo ? "activo" : "inactivo"} />
        )}
      </div>

      <section>
        <h2 className="mb-3">Viviendas y chorros</h2>
        {(data.viviendas ?? []).length === 0 ? (
          <EmptyState
            title="Sin viviendas"
            description="La vivienda y los chorros se anotan en esta ficha."
            action={
              isAdmin ? (
                <Button onClick={() => setViviendaOpen(true)}>
                  Agregar vivienda
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-8">
            {data.viviendas!.map((v) => (
              <div key={v.id} className="border-t border-border pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{v.direccion}</p>
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      Cobro desde{" "}
                      <span className="tabular-nums">{v.anioInicioCobro}</span>
                      {" · "}
                      {v.activa ? "Activa" : "Inactiva"}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setChorroForm({ cantidad: 1 });
                        setChorroOpen(v.id);
                      }}
                    >
                      Agregar chorro
                    </Button>
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

      <Dialog open={viviendaOpen} onOpenChange={setViviendaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva vivienda</DialogTitle>
          </DialogHeader>
          <form onSubmit={crearVivienda} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Año inicio de cobro</Label>
              <Input
                className="font-mono"
                type="number"
                value={anioInicio}
                onChange={(e) => setAnioInicio(Number(e.target.value))}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
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
              <Label>Cantidad de chorros</Label>
              <Input
                type="number"
                min={1}
                value={chorroForm.cantidad}
                onChange={(e) =>
                  setChorroForm({
                    cantidad: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio unitario</Label>
              <Input
                value={formatQuetzales(PRECIO_CHORRO_UNITARIO)}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio total de compra</Label>
              <Input
                value={formatQuetzales(chorroForm.cantidad * PRECIO_CHORRO_UNITARIO)}
                readOnly
                className="bg-muted font-semibold"
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PageStack>
  );
}
