"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, House, Receipt, Search, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, downloadBlob } from "@/lib/api";
import { exportCsv } from "@/lib/export-csv";
import { formatDpi, formatQuetzales } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { cn } from "@/lib/utils";

type Tipo = "usuarios" | "viviendas" | "pagos" | "ingresos";
interface ReporteData { titulo: string; columnas: string[]; filas: string[][]; serie?: { mes: number; total: number }[]; }
const REPORTES = [
  { value: "usuarios" as const, label: "Usuarios", icon: Users, color: "text-blue-600 bg-blue-500/10" },
  { value: "viviendas" as const, label: "Viviendas", icon: House, color: "text-violet-600 bg-violet-500/10" },
  { value: "pagos" as const, label: "Recibos", icon: Receipt, color: "text-cyan-600 bg-cyan-500/10" },
  { value: "ingresos" as const, label: "Ingresos", icon: Wallet, color: "text-emerald-600 bg-emerald-500/10" },
];
export default function ReportesPage() {
  const [tipo, setTipo] = useState<Tipo>("usuarios");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [anioInput, setAnioInput] = useState(String(anio));
  const [data, setData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const anual = tipo === "pagos" || tipo === "ingresos";
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null); setError(null); setPage(1); setQ("");
    const query = tipo === "usuarios" || tipo === "viviendas" ? "" : `?anio=${anio}`;
    api<ReporteData>(`/api/reportes/${tipo}${query}`).then((result) => { if (!cancelled) setData(result); }).catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudo cargar el reporte."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tipo, anio, revision]);
  const filtered = useMemo(() => (data?.filas ?? []).filter((fila) => fila.some((value) => String(value).toLocaleLowerCase().includes(q.trim().toLocaleLowerCase()) || (/^[\d\s-]+$/.test(q.trim()) && String(value).replace(/\D/g, "").includes(q.replace(/\D/g, ""))))), [data, q]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const importe = data ? data.filas.reduce((n, fila) => n + Number((fila[tipo === "ingresos" ? 2 : 4] ?? "").replace(/[^\d.-]/g, "")), 0) : 0;
  async function exportarPdf() {
    if (loading || !data || exportando) return;
    setExportando(true);
    try {
      const query = anual ? `?anio=${anio}` : "";
      const blob = await api<Blob>(`/api/reportes/${tipo}/pdf${query}`);
      downloadBlob(blob, `reporte-${tipo}.pdf`);
      toast.success("Reporte PDF descargado");
    } catch (err) { toast.error(err instanceof ApiError ? err.message : "No se pudo exportar el PDF."); }
    finally { setExportando(false); }
  }
  return (
    <PageStack>
      <PageIntro title="Centro de reportes" action={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={loading || !data || !filtered.length} onClick={() => data && exportCsv(`reporte-${tipo}.csv`, data.columnas, filtered)}><FileSpreadsheet className="size-4" />Exportar CSV</Button><Button disabled={loading || !data || exportando} onClick={() => void exportarPdf()}><Download className="size-4" />{exportando ? "Exportando…" : "Exportar PDF"}</Button></div>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{REPORTES.map(({ value, label, icon: Icon, color }) => <button key={value} type="button" aria-pressed={tipo === value} onClick={() => setTipo(value)} className={cn("admin-surface flex items-center gap-3 p-5 text-left transition-ui hover:border-primary/40", tipo === value && "border-primary/60 ring-2 ring-primary/10")}><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", color)}><Icon className="size-5" /></span><span><span className="block text-sm font-semibold">{label}</span></span></button>)}</div>
      <p className="text-xs text-muted-foreground">PDF: reporte completo · CSV: resultados filtrados</p>
      <section className="admin-surface overflow-hidden">
        <div className="admin-surface-header"><div><h2>{data?.titulo ?? "Preparando reporte"}</h2><p className="mt-1 text-xs text-muted-foreground">{anual ? `Período del 1 de enero al 31 de diciembre de ${anio}` : "Todos los registros de la comunidad"}</p></div>{anual && <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setAnio(Number(anioInput)); }}><Input className="h-10 w-24" type="number" min="2000" max="2100" required value={anioInput} onChange={(e) => setAnioInput(e.target.value)} aria-label="Año del reporte" /><Button variant="outline" size="sm" type="submit">Aplicar año</Button></form>}</div>
        {loading ? <div className="space-y-5 p-6">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div> : error ? <div role="alert" className="p-6 text-sm text-destructive">{error}<Button variant="outline" className="ml-3" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></div> : data && <>
          <div className="grid gap-5 border-b border-border bg-muted/20 px-6 py-5 sm:grid-cols-2"><div><p className="admin-kicker">Registros</p><p className="mt-2 text-2xl font-semibold tabular-nums">{data.filas.length}</p></div><div><p className="admin-kicker">{anual ? "Importe registrado" : "Estado de los registros"}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{anual ? formatQuetzales(importe) : `${data.filas.filter((f) => f[f.length - 1] === "Activo" || f[f.length - 1] === "Activa").length} activos`}</p></div></div>
          <div className="relative m-5"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-md pl-9" aria-label="Buscar en el reporte" placeholder="Buscar dentro de este reporte…" /></div>
          <Table><TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">{data.columnas.map((c) => <TableHead key={c} className="px-6">{c}</TableHead>)}</TableRow></TableHeader><TableBody>{filtered.length ? filtered.slice((page - 1) * 12, page * 12).map((fila, i) => <TableRow key={i}>{fila.map((celda, j) => <TableCell key={j} className={cn("px-6 text-xs", j === 0 ? "font-medium" : "text-muted-foreground")}>{celda === "Activo" || celda === "Activa" ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600">{celda}</span> : celda === "Inactivo" || celda === "Inactiva" ? <span className="rounded-full bg-muted px-2.5 py-1 text-[10px]">{celda}</span> : data.columnas[j].trim().toUpperCase() === "DPI" ? formatDpi(celda) : celda}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={data.columnas.length}><EmptyState className="items-center px-5 text-center" title={q ? "Sin coincidencias en el reporte" : "Sin movimientos en este período"} description={q ? "Sin resultados con esta búsqueda." : undefined} action={!q ? <Button variant="outline" onClick={() => setTipo("usuarios")}>Ver padrón de usuarios</Button> : undefined} /></TableCell></TableRow>}</TableBody></Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4"><p className="text-[11px] text-muted-foreground">{filtered.length ? `${(page - 1) * 12 + 1}–${Math.min(page * 12, filtered.length)}` : "0"} de {filtered.length} registros</p><div className="flex items-center gap-3"><Button variant="outline" size="icon-sm" aria-label="Página anterior del reporte" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}><ChevronLeft className="size-4" /></Button><span className="text-xs text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="icon-sm" aria-label="Página siguiente del reporte" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}><ChevronRight className="size-4" /></Button></div></div>
        </>}
      </section>
    </PageStack>
  );
}
