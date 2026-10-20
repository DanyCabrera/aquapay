"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CalendarDays, Droplets, FileText, Plus, Receipt, RefreshCw, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardData, Recibo } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { PageStack } from "@/components/layout/page-stack";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatQuetzales } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReceiptList } from "./receipt-list";
import { ReciboPdfViewer, sourceFromRecibo, type ReciboPdfSource } from "@/components/facturacion/recibo-pdf-viewer";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function TesoreroDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState<ReciboPdfSource | null>(null);
  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [resumen, lista] = await Promise.all([api<DashboardData>("/api/facturacion/dashboard"), api<Recibo[]>("/api/facturacion/recibos?limit=5")]);
      setData(resumen); setRecibos(lista);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar el resumen."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);
  const serie = MESES.map((mes, i) => ({ mes, total: data?.ingresosPorMes.find((m) => m.mes === i + 1)?.total ?? 0 }));
  const acumulado = serie.reduce((s, m) => s + m.total, 0);
  const mes = new Intl.DateTimeFormat("es-GT", { month: "long", year: "numeric", timeZone: "America/Guatemala" }).format(new Date());
  return <PageStack className="gap-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Resumen de tesorería</h2></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Actualizar resumen" disabled={loading} onClick={() => void cargar()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button><Link href="/facturacion" className={buttonVariants()}><Plus className="size-4" />Emitir</Link></div></div>
    <p className="flex items-center gap-2 text-xs capitalize text-muted-foreground"><CalendarDays className="size-4" />Resumen de {mes}</p>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button variant="outline" onClick={() => void cargar()}>Reintentar</Button></div>}
    <LedgerStats items={[
      { label: "Ingresos del mes", value: data ? formatQuetzales(data.ingresosMes) : "—", icon: Wallet },
      { label: "Tarifa anual", value: data ? formatQuetzales(data.ingresosMesTarifa ?? 0) : "—", icon: Receipt },
      { label: "Compra de chorro", value: data ? formatQuetzales(data.ingresosMesChorro ?? 0) : "—", icon: Droplets },
      { label: "Recibos", value: data?.facturasMes ?? "—", icon: FileText },
    ]} />
    <div className="grid items-stretch gap-5 xl:grid-cols-[1.8fr_1fr]">
      <section className="admin-surface min-w-0"><div className="admin-surface-header"><div><h2>Evolución de ingresos</h2><p className="mt-1 text-xs text-muted-foreground">Recaudación mensual · {new Date().getFullYear()}</p></div><span className="text-xs text-muted-foreground">Quetzales</span></div><div className="p-5 sm:p-6"><p className="text-2xl font-semibold tabular-nums">{data ? formatQuetzales(acumulado) : "—"}</p><p className="mb-6 mt-1 text-xs text-muted-foreground">Acumulado del año</p>{loading ? <Skeleton className="h-52 w-full" /> : data ? <><div className="h-52 w-full" role="img" aria-label={`Ingresos mensuales. Acumulado ${formatQuetzales(acumulado)}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={serie} margin={{ top: 10, right: 8, left: 0, bottom: 6 }}><defs><linearGradient id="treasuryIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" /><XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis width={45} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, (max: number) => max || 100]} /><Tooltip formatter={(value) => formatQuetzales(Number(value))} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} /><Area dataKey="total" name="Ingresos" type="monotone" stroke="var(--primary)" strokeWidth={2.5} fill="url(#treasuryIncome)" /></AreaChart></ResponsiveContainer></div>{acumulado === 0 && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Sin ingresos registrados este año.</p>}</> : <p className="text-sm text-muted-foreground">Resumen no disponible. Reintenta la consulta.</p>}</div></section>
      <section className="admin-surface"><div className="admin-surface-header"><div><h2>Servicio de agua</h2></div><Wallet className="size-5 text-primary" /></div><div className="p-6"><p className="admin-kicker">Tarifa anual vigente por chorro</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data ? formatQuetzales(data.tarifaAnual) : "—"}</p><dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Beneficiarios activos</dt><dd className="font-semibold">{data?.totalUsuarios ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Viviendas activas</dt><dd className="font-semibold">{data?.totalViviendas ?? "—"}</dd></div></dl></div></section>
    </div>
    <section className="admin-surface min-w-0"><div className="admin-surface-header"><div><h2>Últimos recibos</h2></div><Link href="/historial" className="inline-flex items-center gap-2 text-xs font-medium text-primary">Ver historial<ArrowRight className="size-3.5" /></Link></div>{loading ? <div className="space-y-4 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : error ? <p className="p-6 text-sm text-muted-foreground">No se pudo consultar la actividad reciente.</p> : recibos.length ? <ReceiptList recibos={recibos} onOpen={(r) => setPdf(sourceFromRecibo(r))} /> : <EmptyState className="px-6" title="Sin recibos registrados" action={<Link href="/facturacion" className={buttonVariants({ variant: "outline" })}>Emitir recibo<ArrowRight className="size-4" /></Link>} />}</section>
    <ReciboPdfViewer source={pdf} onClose={() => setPdf(null)} />
  </PageStack>;
}
