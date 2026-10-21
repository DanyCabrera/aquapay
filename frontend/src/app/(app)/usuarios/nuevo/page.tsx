"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { UsuarioComunidad, Vivienda } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageBackLink } from "@/components/layout/page-stack";
import { Check } from "lucide-react";
import { PRECIO_CHORRO_UNITARIO } from "@/lib/navigation";
import { formatDpi, formatQuetzales } from "@/lib/format";

const STEPS = [
  { id: 1, label: "Persona" },
  { id: 2, label: "Vivienda" },
  { id: 3, label: "Chorro" },
] as const;

export default function NuevoBeneficiarioPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [saving, setSaving] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [viviendaId, setViviendaId] = useState<string | null>(null);

  const [personal, setPersonal] = useState({
    nombreCompleto: "",
    dpi: "",
    telefono: "",
  });
  const [vivienda, setVivienda] = useState({
    direccion: "",
    anioInicioCobro: String(new Date().getFullYear()),
    activa: true,
  });
  const [instalacion, setInstalacion] = useState({
    cantidad: "1",
    fechaInstalacion: new Date().toISOString().slice(0, 10),
  });

  const totalCompra = Number(instalacion.cantidad) * PRECIO_CHORRO_UNITARIO;

  async function submitPaso1(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (usuarioId) {
        await api(`/api/usuarios/${usuarioId}`, {
          method: "PATCH",
          body: JSON.stringify({
            nombreCompleto: personal.nombreCompleto,
            telefono: personal.telefono || undefined,
          }),
        });
      } else {
        const created = await api<UsuarioComunidad>("/api/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nombreCompleto: personal.nombreCompleto,
            dpi: personal.dpi,
            telefono: personal.telefono || undefined,
          }),
        });
        setUsuarioId(created.id);
      }
      setPaso(2);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function submitPaso2(e: FormEvent) {
    e.preventDefault();
    if (!usuarioId) {
      toast.error("Complete primero los datos personales");
      setPaso(1);
      return;
    }
    setSaving(true);
    try {
      if (viviendaId) {
        await api(`/api/usuarios/viviendas/${viviendaId}`, {
          method: "PATCH",
          body: JSON.stringify({
            direccion: vivienda.direccion,
            activa: vivienda.activa,
            anioInicioCobro: Number(vivienda.anioInicioCobro),
          }),
        });
      } else {
        const created = await api<Vivienda>(`/api/usuarios/${usuarioId}/viviendas`, {
          method: "POST",
          body: JSON.stringify({
            direccion: vivienda.direccion,
            anioInicioCobro: Number(vivienda.anioInicioCobro),
          }),
        });
        setViviendaId(created.id);
        if (!vivienda.activa) {
          await api(`/api/usuarios/viviendas/${created.id}`, {
            method: "PATCH",
            body: JSON.stringify({ activa: false }),
          });
        }
      }
      setPaso(3);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function submitPaso3(e: FormEvent) {
    e.preventDefault();
    if (!viviendaId) {
      toast.error("Complete primero la vivienda");
      setPaso(2);
      return;
    }
    setSaving(true);
    try {
      await api(`/api/usuarios/viviendas/${viviendaId}/chorros`, {
        method: "POST",
        body: JSON.stringify({
          cantidad: Number(instalacion.cantidad),
          precioCompra: totalCompra,
          fechaInstalacion: instalacion.fechaInstalacion,
        }),
      });
      toast.success("Beneficiario registrado correctamente");
      router.push(usuarioId ? `/usuarios/${usuarioId}` : "/usuarios");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo finalizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 space-y-3">
        <PageBackLink href="/usuarios">Volver a beneficiarios</PageBackLink>
        <div><h2 className="text-2xl font-semibold tracking-tight">Registrar beneficiario</h2></div>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2">{STEPS.map((step) => <div key={step.id} aria-current={paso === step.id ? "step" : undefined} className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${paso === step.id ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground"}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${paso >= step.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{paso > step.id ? <Check className="size-3.5" /> : step.id}</span><span className="font-medium">{step.label}</span></div>)}</div>
      <div className="mx-auto w-full max-w-3xl"><section className="admin-surface p-6 sm:p-7"><div className="mb-6 border-b border-border pb-5"><p className="admin-kicker">Paso {paso} de 3</p><h2 className="mt-2 text-lg">{paso === 1 ? "Datos del beneficiario" : paso === 2 ? "Información de la vivienda" : "Instalación del chorro"}</h2></div>
      {paso === 1 && (
        <form
          onSubmit={submitPaso1}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              className="h-10"
              placeholder="Juan Pérez López"
              value={personal.nombreCompleto}
              onChange={(e) =>
                setPersonal({ ...personal, nombreCompleto: e.target.value })
              }
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dpi">DPI</Label>
              <Input
                id="dpi"
                className="h-10 font-mono"
                placeholder="0000 00000 0000"
                value={formatDpi(personal.dpi, "")}
                onChange={(e) =>
                  setPersonal({
                    ...personal,
                    dpi: e.target.value.replace(/\D/g, "").slice(0, 13),
                  })
                }
                required
                inputMode="numeric"
                pattern="[0-9]{4} [0-9]{5} [0-9]{4}"
                maxLength={15}
                disabled={!!usuarioId}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tel">Teléfono</Label>
              <Input
                id="tel"
                type="tel"
                maxLength={30}
                className="h-10 font-mono"
                placeholder="+502 #### ####"
                value={personal.telefono}
                onChange={(e) =>
                  setPersonal({ ...personal, telefono: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/usuarios")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Continuar"}
            </Button>
          </div>
        </form>
      )}

      {paso === 2 && (
        <form
          onSubmit={submitPaso2}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="direccion">
              Dirección
            </Label>
            <textarea
              id="direccion"
              className="min-h-24 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              placeholder="Lote 24, cerca de la escuela"
              value={vivienda.direccion}
              onChange={(e) =>
                setVivienda({ ...vivienda, direccion: e.target.value })
              }
              required
              minLength={3}
              maxLength={300}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="anio">
              Año de inicio de cobro
            </Label>
            <Input
              id="anio"
              type="number"
              className="h-10 font-mono"
              min={2000}
              max={2100}
              value={vivienda.anioInicioCobro}
              onChange={(e) =>
                setVivienda({
                  ...vivienda,
                  anioInicioCobro: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium">Vivienda activa</p>
            </div>
            <Switch
              checked={vivienda.activa}
              onCheckedChange={(checked) =>
                setVivienda({ ...vivienda, activa: checked })
              }
              onLabel="Activa"
              offLabel="Inactiva"
              aria-label="Vivienda activa"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaso(1)}
            >
              Anterior
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Continuar"}
            </Button>
          </div>
        </form>
      )}

      {paso === 3 && (
        <form
          onSubmit={submitPaso3}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cantidad">Cantidad de chorros</Label>
            <div className="relative">
              <Input
                id="cantidad"
                type="number"
                min={1}
                className="h-10 font-mono"
                value={instalacion.cantidad}
                onChange={(e) =>
                  setInstalacion({
                    ...instalacion,
                    cantidad: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="precio">Precio unitario</Label>
            <Input
              id="precio"
              className="h-10 bg-muted font-mono"
              value={formatQuetzales(PRECIO_CHORRO_UNITARIO)}
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total">Total de compra</Label>
            <Input
              id="total"
              className="h-10 font-mono"
              value={formatQuetzales(totalCompra)}
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha de instalación</Label>
            <Input
              id="fecha"
              type="date"
              className="h-10 font-mono"
              value={instalacion.fechaInstalacion}
              onChange={(e) =>
                setInstalacion({
                  ...instalacion,
                  fechaInstalacion: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaso(2)}
            >
              Anterior
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Finalizar"}
            </Button>
          </div>
        </form>
      )}
      </section></div></div>
  );
}
