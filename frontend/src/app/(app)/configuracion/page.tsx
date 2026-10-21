"use client";

import { FormEvent, useEffect, useState } from "react";
import { Calculator, CircleDollarSign, Droplets, Info, Loader2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { UsuarioComunidad } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { formatQuetzales } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageStack, PageIntro } from "@/components/layout/page-stack";

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [tarifa, setTarifa] = useState("");
  const [actual, setActual] = useState("");
  const [lugar, setLugar] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [conexiones, setConexiones] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (user?.rol !== "administrador") return;
    let cancelled = false;
    setLoading(true); setError(null);
    Promise.all([
      api<{ tarifaAnual: number; lugarPago: string }>("/api/facturacion/config"),
      api<UsuarioComunidad[]>("/api/usuarios"),
    ]).then(([config, usuarios]) => {
      if (cancelled) return;
      setTarifa(String(config.tarifaAnual)); setActual(String(config.tarifaAnual)); setLugar(config.lugarPago);
      setConexiones(usuarios.filter((u) => u.activo).reduce((s, u) => s + (u.viviendas ?? []).filter((v) => v.activa).reduce((t, v) => t + (v.chorros ?? []).filter((c) => c.activo).reduce((n, c) => n + c.cantidad, 0), 0), 0));
    }).catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.rol, revision]);
  const modificada = Number(tarifa) !== Number(actual);
  const valida = Number.isFinite(Number(tarifa)) && Number(tarifa) >= 0.01;
  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!valida || !modificada || loading || saving) return;
    setSaving(true);
    try {
      await api("/api/facturacion/config/tarifa", { method: "PUT", body: JSON.stringify({ tarifaAnual: Number(tarifa) }) });
      setActual(String(Number(tarifa))); setTarifa(String(Number(tarifa)));
      toast.success("Tarifa anual actualizada");
    } catch (err) { toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la tarifa."); }
    finally { setSaving(false); }
  }
  return (
    <PageStack>
      <PageIntro title="Tarifa y configuración" />
      {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error} <Button variant="outline" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></div>}
      <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="admin-surface overflow-hidden">
          <div className="admin-surface-header"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><CircleDollarSign className="size-5" /></span><div><h2>Tarifa del servicio de agua</h2></div></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-600">Anual · Por chorro</span></div>
          <div className="border-b border-border bg-primary/5 px-6 py-6"><p className="admin-kicker">Tarifa vigente</p><p className="mt-2 text-4xl font-semibold tracking-tight">{loading ? "—" : formatQuetzales(actual)}</p><p className="mt-2 text-xs text-muted-foreground">por chorro, por año de servicio</p></div>
          <form onSubmit={guardar} className="space-y-6 p-6">
            <div className="space-y-2"><Label htmlFor="tarifa">Tarifa anual por chorro</Label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Q</span><Input id="tarifa" type="number" min="0.01" step="0.01" className="h-12 pl-10 text-lg font-semibold" value={tarifa} onChange={(e) => setTarifa(e.target.value)} required disabled={loading || saving || !!error} /></div></div>
            <div className="space-y-2"><Label htmlFor="lugar">Lugar de pago</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="lugar" value={lugar} readOnly className="bg-muted/50 pl-9 text-xs text-muted-foreground" /></div></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p className="text-xs text-muted-foreground">{modificada ? "Cambios sin guardar" : "Sin cambios pendientes"}</p><Button type="submit" disabled={saving || loading || !!error || !modificada || !valida}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? "Guardando…" : "Guardar cambios"}</Button></div>
          </form>
        </section>
        <div className="space-y-5">
          <section className="admin-surface"><div className="admin-surface-header"><div className="flex items-center gap-2"><Calculator className="size-4 text-primary" /><h2>Simulador de tarifa</h2></div></div><div className="space-y-5 p-6"><p className="text-xs leading-relaxed text-muted-foreground">Estimación sin registrar cobros.</p><div className="space-y-2"><Label htmlFor="simulador-chorros">Cantidad de chorros</Label><Input id="simulador-chorros" type="number" min="1" max="1000" step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} /></div><div className="rounded-xl bg-muted/60 p-5"><p className="text-xs text-muted-foreground">{modificada ? "Estimado con la tarifa propuesta" : "Importe anual estimado"}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{!loading && valida && Number(cantidad) >= 1 ? formatQuetzales(Number(tarifa) * Number(cantidad)) : "—"}</p><p className="mt-2 text-[11px] text-muted-foreground">{cantidad || "0"} {Number(cantidad) === 1 ? "chorro" : "chorros"} × {formatQuetzales(tarifa)} / año</p></div></div></section>
          <div className="admin-module-help"><div className="flex items-center gap-2 text-sm font-semibold"><Droplets className="size-4 text-cyan-600" />Alcance del servicio</div><p className="mt-3 text-2xl font-semibold">{loading ? "—" : conexiones} <span className="text-xs font-normal text-muted-foreground">chorros activos</span></p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Compra de chorro no incluida en la tarifa anual.</p></div>
          {modificada && <p className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300"><Info className="size-4 shrink-0" />El simulador muestra una propuesta. La tarifa vigente se conserva hasta guardar.</p>}
        </div>
      </div>
    </PageStack>
  );
}
