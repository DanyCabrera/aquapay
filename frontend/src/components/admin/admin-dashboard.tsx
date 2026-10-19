"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownLeft, ArrowRight, CalendarDays, CircleDollarSign, Droplets, FileText, House, Plus, Receipt, RefreshCw, Search, ShieldCheck, Users, Wallet } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardData, Recibo, UsuarioComunidad } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageStack } from "@/components/layout/page-stack";
import { formatFecha, formatQuetzales } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCIONES = [
  { href: "/usuarios/nuevo", label: "Registrar beneficiario", hint: "Persona, vivienda y chorro", icon: Plus, color: "bg-blue-500/10 text-blue-600" },
  { href: "/pagos", label: "Consultar pago", hint: "Buscar por nombre o DPI", icon: Search, color: "bg-emerald-500/10 text-emerald-600" },
  { href: "/reportes", label: "Revisar reportes", hint: "Información para tomar decisiones", icon: FileText, color: "bg-violet-500/10 text-violet-600" },
  { href: "/configuracion", label: "Cambiar tarifa", hint: "Configuración anual del servicio", icon: CircleDollarSign, color: "bg-amber-500/10 text-amber-600" },
];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioComunidad[]>([]);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [resumen, padron, pagos] = await Promise.all([
        api<DashboardData>("/api/facturacion/dashboard"), api<UsuarioComunidad[]>("/api/usuarios"), api<Recibo[]>("/api/facturacion/recibos?limit=5"),
      ]);
      setData(resumen); setUsuarios(padron); setRecibos(pagos);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "No se pudo cargar el resumen.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const activos = usuarios.filter((u) => u.activo).length;
  const sinVivienda = usuarios.filter((u) => u.activo && !u.viviendas?.length).length;
  const completos = usuarios.filter((u) => u.activo && u.viviendas?.some((v) => v.activa && v.chorros?.some((c) => c.activo))).length;
  const cobertura = activos ? Math.round(completos / activos * 100) : 0;
  const recientes = [...usuarios].sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro)).slice(0, 5);
  const serie = MESES.map((mes, i) => ({ mes, total: data?.ingresosPorMes.find((m) => m.mes === i + 1)?.total ?? 0 }));
  const totalAnual = serie.reduce((s, m) => s + m.total, 0);
  const fecha = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Guatemala" }).format(new Date());
  const stats = [
    { label: "Beneficiarios", value: data?.totalUsuarios, hint: `${usuarios.length} registrados en el padrón`, icon: Users, color: "text-blue-600 bg-blue-500/10", href: "/usuarios" },
    { label: "Viviendas activas", value: data?.totalViviendas, hint: "Hogares con servicio habilitado", icon: House, color: "text-violet-600 bg-violet-500/10", href: "/reportes" },
    { label: "Chorros activos", value: data?.totalChorros, hint: "Conexiones de agua de la comunidad", icon: Droplets, color: "text-cyan-600 bg-cyan-500/10", href: "/usuarios" },
    { label: "Total cobrado", value: data ? formatQuetzales(data.ingresosMes) : undefined, hint: `${data?.facturasMes ?? 0} recibos durante este mes`, icon: Wallet, color: "text-emerald-600 bg-emerald-500/10", href: "/reportes" },
  ];

  return (
    <PageStack className="gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="admin-kicker mb-2">Visión general · Administrador</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h2><p className="mt-2 text-sm text-muted-foreground">Hola, {user?.nombre.split(" ")[0]}. Así está el servicio de agua de Aldea Sibaná.</p></div>
        <div className="flex flex-wrap items-center gap-3"><span className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground sm:inline-flex"><CalendarDays className="size-4" />{fecha}</span><Button variant="outline" size="icon" aria-label="Actualizar resumen" disabled={loading} onClick={() => void cargar()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button></div>
      </div>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button variant="outline" onClick={() => void cargar()}>Reintentar</Button></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon, color, href }) => <Link key={label} href={href} className="admin-surface group p-5 transition-ui hover:-translate-y-0.5 hover:border-primary/30"><div className="flex items-center justify-between gap-2"><span className={cn("flex size-10 items-center justify-center rounded-xl", color)}><Icon className="size-5" /></span><ArrowRight className="size-4 text-muted-foreground opacity-0 transition-ui group-hover:opacity-100" /></div><p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight">{value ?? "—"}</p><p className="mt-2 text-[11px] text-muted-foreground">{hint}</p></Link>)}
      </div>
      <div className="grid items-stretch gap-5 xl:grid-cols-[1.8fr_1fr]">
        <section className="admin-surface min-w-0">
          <div className="admin-surface-header"><div><h2>Ingresos de la comunidad</h2><p className="mt-1 text-xs text-muted-foreground">Evolución mensual · {new Date().getFullYear()}</p></div><Link href="/reportes" className="inline-flex items-center gap-1 text-xs font-medium text-primary">Ver reporte <ArrowRight className="size-3.5" /></Link></div>
          <div className="p-5 sm:p-6"><div className="mb-6 flex flex-wrap items-baseline gap-3"><span className="text-2xl font-semibold tracking-tight">{data ? formatQuetzales(totalAnual) : "—"}</span><span className="text-xs text-muted-foreground">acumulado del año</span></div>
            <div className="h-[210px] w-full" role="img" aria-label={`Ingresos mensuales del año. Total: ${formatQuetzales(totalAnual)}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={serie} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}><defs><linearGradient id="adminIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#426be9" stopOpacity={0.18} /><stop offset="100%" stopColor="#426be9" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} dy={10} /><YAxis axisLine={false} tickLine={false} width={46} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={[0, (max: number) => max || 100]} /><Tooltip formatter={(value) => formatQuetzales(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} /><Area type="monotone" dataKey="total" name="Ingresos" stroke="#426be9" strokeWidth={2.5} fill="url(#adminIncome)" /></AreaChart></ResponsiveContainer></div>
            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-border pt-4 text-xs"><span className="text-muted-foreground">Tarifa anual <strong className="ml-2 font-medium text-foreground">{formatQuetzales(data?.ingresosMesTarifa)}</strong></span><span className="text-muted-foreground">Compra de chorro <strong className="ml-2 font-medium text-foreground">{formatQuetzales(data?.ingresosMesChorro)}</strong></span></div>
            {data && totalAnual === 0 && <p className="mt-3 text-[11px] text-muted-foreground">Aún no hay cobros registrados este año. La gráfica se actualizará cuando tesorería emita recibos.</p>}
          </div>
        </section>
        <section className="admin-surface flex flex-col"><div className="admin-surface-header"><div><h2>Estado del padrón</h2><p className="mt-1 text-xs text-muted-foreground">Calidad de los registros del servicio</p></div><ShieldCheck className="size-5 text-emerald-600" /></div><div className="flex flex-1 flex-col p-6"><div className="flex items-end justify-between"><div><p className="text-4xl font-semibold tracking-tight">{data ? `${cobertura}%` : "—"}</p><p className="mt-2 text-xs text-muted-foreground">Beneficiarios activos con conexión</p></div><span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Droplets className="size-6" /></span></div><div className="mb-6 mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${cobertura}%` }} /></div><dl className="space-y-4 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Activos</dt><dd className="font-semibold tabular-nums">{activos}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Inactivos</dt><dd className="font-semibold tabular-nums">{usuarios.length - activos}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Sin vivienda registrada</dt><dd className="font-semibold tabular-nums">{sinVivienda}</dd></div></dl><Link href="/usuarios" className="mt-6 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 text-xs font-medium text-primary">Ver el padrón <ArrowRight className="size-4" /></Link></div></section>
      </div>
      <section><div className="mb-3 flex items-center gap-3"><h2>Siguientes pasos</h2><span className="text-[11px] text-muted-foreground">Accesos de administración</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{ACCIONES.map(({ href, label, hint, icon: Icon, color }) => <Link key={href} href={href} className="admin-surface group flex items-start gap-3 p-4 transition-ui hover:border-primary/30"><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", color)}><Icon className="size-4" /></span><span><span className="block text-xs font-semibold">{label}</span><span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{hint}</span></span></Link>)}</div></section>
      <div className="grid items-start gap-5 xl:grid-cols-[1.3fr_1fr]">
        <section className="admin-surface"><div className="admin-surface-header"><div><h2>Últimos beneficiarios registrados</h2><p className="mt-1 text-xs text-muted-foreground">Las incorporaciones más recientes al padrón</p></div><Link href="/usuarios" className="text-xs font-medium text-primary">Ver todos</Link></div><div className="divide-y divide-border">{recientes.map((u) => <Link key={u.id} href={`/usuarios/${u.id}`} className="flex items-center gap-3 px-6 py-4 transition-ui hover:bg-muted/40"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-xs font-semibold text-primary">{u.nombreCompleto.split(" ").slice(0, 2).map((n) => n[0]).join("")}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{u.nombreCompleto}</p><p className="mt-1 text-[11px] text-muted-foreground">{u.viviendas?.length ?? 0} viviendas · {formatFecha(u.fechaRegistro)}</p></div><span className={cn("rounded-full px-2 py-1 text-[10px] font-medium", u.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>{u.activo ? "Activo" : "Inactivo"}</span><ArrowRight className="size-3.5 text-muted-foreground" /></Link>)}{!loading && !recientes.length && <p className="p-6 text-sm text-muted-foreground">El primer beneficiario que registre aparecerá aquí.</p>}</div></section>
        <section className="admin-surface"><div className="admin-surface-header"><div><h2>Actividad de pagos</h2><p className="mt-1 text-xs text-muted-foreground">Últimos recibos emitidos por tesorería</p></div><Receipt className="size-4 text-muted-foreground" /></div>{recibos.length ? <div className="divide-y divide-border">{recibos.map((r) => <Link key={r.id} href={`/pagos?dpi=${r.vivienda?.usuario?.dpi ?? ""}`} className="flex items-center gap-3 px-6 py-4 hover:bg-muted/40"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><ArrowDownLeft className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{r.vivienda?.usuario?.nombreCompleto ?? `Recibo ${r.numeroRecibo}`}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatFecha(r.fechaPago)} · {r.tipoCobro === "tarifa_anual" ? "Tarifa anual" : "Compra de chorro"}</p></div><span className="text-xs font-semibold">{formatQuetzales(r.totalPagado)}</span></Link>)}</div> : <div className="p-6"><span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><Receipt className="size-5" /></span><h3>Todo listo para los primeros cobros</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Los beneficiarios registrados ya pueden ser atendidos por tesorería. Aquí verá los pagos reales a medida que se emitan los recibos.</p><Link href="/pagos" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5")}>Consultar pago <ArrowRight className="size-3.5" /></Link></div>}</section>
      </div>
    </PageStack>
  );
}
