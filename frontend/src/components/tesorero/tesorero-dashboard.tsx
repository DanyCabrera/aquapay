"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CalendarDays, CheckCircle2, Droplets, FileText, History, Plus, Receipt, RefreshCw, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
  const { user } = useAuth();
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
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="admin-kicker mb-2">Visión general · Tesorero</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tu centro de cobros</h2><p className="mt-2 text-sm text-muted-foreground">Hola, {user?.nombre.split(" ")[0]}. Consulta los ingresos y atiende a la comunidad.</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Actualizar resumen" disabled={loading} onClick={() => void cargar()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button><Link href="/facturacion" className={buttonVariants()}><Plus className="size-4" />Emitir</Link></div></div>
    <p className="flex items-center gap-2 text-xs capitalize text-muted-foreground"><CalendarDays className="size-4" />Resumen de {mes}</p>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button variant="outline" onClick={() => void cargar()}>Reintentar</Button></div>}
    <LedgerStats items={[
      { label: "Total", value: data ? formatQuetzales(data.ingresosMes) : "—", hint: "recaudado este mes", icon: Wallet },
      { label: "Tarifa anual", value: data ? formatQuetzales(data.ingresosMesTarifa ?? 0) : "—", hint: "cobros de servicio este mes", icon: Receipt },
      { label: "Compra de chorro", value: data ? formatQuetzales(data.ingresosMesChorro ?? 0) : "—", hint: "cobros de instalación este mes", icon: Droplets },
      { label: "Recibos", value: data?.facturasMes ?? "—", hint: "emitidos este mes", icon: FileText },
    ]} />
    <div className="grid items-stretch gap-5 xl:grid-cols-[1.8fr_1fr]">
      <section className="admin-surface min-w-0"><div className="admin-surface-header"><div><h2>Evolución de ingresos</h2><p className="mt-1 text-xs text-muted-foreground">Recaudación mensual · {new Date().getFullYear()}</p></div><span className="text-xs text-muted-foreground">Quetzales</span></div><div className="p-5 sm:p-6"><p className="text-2xl font-semibold tabular-nums">{data ? formatQuetzales(acumulado) : "—"}</p><p className="mb-6 mt-1 text-xs text-muted-foreground">Acumulado del año</p>{loading ? <Skeleton className="h-52 w-full" /> : data ? <><div className="h-52 w-full" role="img" aria-label={`Ingresos mensuales. Acumulado ${formatQuetzales(acumulado)}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={serie} margin={{ top: 10, right: 8, left: 0, bottom: 6 }}><defs><linearGradient id="treasuryIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" /><XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis width={45} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, (max: number) => max || 100]} /><Tooltip formatter={(value) => formatQuetzales(Number(value))} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} /><Area dataKey="total" name="Ingresos" type="monotone" stroke="var(--primary)" strokeWidth={2.5} fill="url(#treasuryIncome)" /></AreaChart></ResponsiveContainer></div>{acumulado === 0 && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Todavía no hay ingresos este año. Cada cobro registrado actualizará este resumen automáticamente.</p>}</> : <p className="text-sm text-muted-foreground">Resumen no disponible. Reintenta la consulta.</p>}</div></section>
      <section className="admin-surface"><div className="admin-surface-header"><div><h2>Preparado para atender</h2><p className="mt-1 text-xs text-muted-foreground">Información del servicio</p></div><Wallet className="size-5 text-primary" /></div><div className="p-6"><p className="admin-kicker">Tarifa anual vigente por chorro</p><p className="mt-3 text-3xl font-semibold tracking-tight">{data ? formatQuetzales(data.tarifaAnual) : "—"}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">El importe final considera los chorros activos y los años pendientes de cada vivienda.</p><dl className="my-5 space-y-3 border-y border-border py-5 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Beneficiarios activos</dt><dd className="font-semibold">{data?.totalUsuarios ?? "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Viviendas activas</dt><dd className="font-semibold">{data?.totalViviendas ?? "—"}</dd></div></dl><Link href="/facturacion" className="flex items-center justify-between rounded-xl bg-primary/5 p-3 text-xs font-semibold text-primary">Iniciar un cobro<ArrowRight className="size-4" /></Link></div></section>
    </div>
    <div className="grid gap-4 sm:grid-cols-2"><Link href="/facturacion" className="admin-surface flex items-start gap-4 p-5"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Receipt className="size-5" /></span><div><h3 className="text-sm font-semibold">Nuevo recibo</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Busca al beneficiario, revisa su deuda y genera el comprobante de pago.</p></div></Link><Link href="/historial" className="admin-surface flex items-start gap-4 p-5"><span className="rounded-xl bg-violet-500/10 p-3 text-violet-600"><History className="size-5" /></span><div><h3 className="text-sm font-semibold">Consultar movimientos</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Filtra los recibos, descarga el listado y vuelve a abrir sus PDF.</p></div></Link></div>
    <section className="admin-surface min-w-0"><div className="admin-surface-header"><div><h2>Últimos recibos</h2><p className="mt-1 text-xs text-muted-foreground">Los 5 movimientos más recientes de tesorería</p></div><Link href="/historial" className="inline-flex items-center gap-2 text-xs font-medium text-primary">Ver historial<ArrowRight className="size-3.5" /></Link></div>{loading ? <div className="space-y-4 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : error ? <p className="p-6 text-sm text-muted-foreground">No se pudo consultar la actividad reciente.</p> : recibos.length ? <ReceiptList recibos={recibos} onOpen={(r) => setPdf(sourceFromRecibo(r))} /> : <EmptyState className="px-6" title="Todo listo para tu primer recibo" description="Aquí aparecerán los pagos registrados. Comienza buscando un beneficiario en el módulo de emisión." action={<Link href="/facturacion" className={buttonVariants({ variant: "outline" })}>Emitir recibo<ArrowRight className="size-4" /></Link>} />}</section>
    <div className="admin-module-help flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /><div><h3 className="text-sm font-semibold">Un cobro claro, de principio a fin</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Verifica el DPI y la vivienda, confirma el concepto y el monto, y entrega el recibo PDF al beneficiario.</p></div></div>
    <ReciboPdfViewer source={pdf} onClose={() => setPdf(null)} />
  </PageStack>;
}
