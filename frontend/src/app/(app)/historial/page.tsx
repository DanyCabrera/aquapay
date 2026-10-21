"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, Droplets, FileText, Filter, Plus, Search, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import type { Recibo } from "@/lib/types";
import { exportCsv } from "@/lib/export-csv";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { nativeSelectClass } from "@/components/layout/page-header";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { formatQuetzales } from "@/lib/format";
import { ReceiptList } from "@/components/tesorero/receipt-list";
import { ReciboPdfViewer, sourceFromRecibo, type ReciboPdfSource } from "@/components/facturacion/recibo-pdf-viewer";

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: ANIO_ACTUAL - 1999 }, (_, i) => ANIO_ACTUAL - i);

export default function HistorialTesoreroPage() {
  const [q, setQ] = useState("");
  const [anio, setAnio] = useState("");
  const [tipo, setTipo] = useState("");
  const [consulta, setConsulta] = useState({ q: "", anio: "" });
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pdf, setPdf] = useState<ReciboPdfSource | null>(null);
  const requestId = useRef(0);
  const pageSize = 12;
  const hayFiltro = Boolean(consulta.q.trim() || consulta.anio || tipo);

  async function cargar(search: string, year: string) {
    const id = ++requestId.current;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (search.trim()) params.set("q", search.trim());
      if (year) params.set("anio", year);
      const lista = await api<Recibo[]>(`/api/facturacion/recibos?${params}`);
      if (id !== requestId.current) return;
      setRecibos(lista); setConsulta({ q: search, anio: year }); setPage(1);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "No se pudo cargar el historial.");
    } finally { if (id === requestId.current) setLoading(false); }
  }
  useEffect(() => { void cargar("", ""); }, []);
  function buscar(e: FormEvent) { e.preventDefault(); void cargar(q, anio); }
  function limpiar() { setQ(""); setAnio(""); setTipo(""); void cargar("", ""); }
  const filtrados = useMemo(() => recibos.filter((r) => !tipo || r.tipoCobro === tipo), [recibos, tipo]);
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageItems = filtrados.slice((page - 1) * pageSize, page * pageSize);
  const total = (type?: string) => filtrados.filter((r) => !type || r.tipoCobro === type).reduce((s, r) => s + Number(r.totalPagado), 0);
  function exportar() {
    exportCsv(`recibos-${consulta.anio || "todos"}.csv`, ["Recibo", "Beneficiario", "DPI", "Fecha de pago", "Concepto", "Total GTQ"], filtrados.map((r) => [r.numeroRecibo, r.vivienda?.usuario?.nombreCompleto ?? "", r.vivienda?.usuario?.dpi ?? "", r.fechaPago, r.tipoCobro === "tarifa_anual" ? "Tarifa anual" : "Compra de chorro", r.totalPagado]));
  }
  const valor = (n: number) => loading || error ? "—" : formatQuetzales(n);
  return <PageStack className="gap-7">
    <div><PageIntro title="Historial de recibos" action={<Link href="/facturacion" className={buttonVariants()}><Plus className="size-4" />Emitir</Link>} /></div>
    <LedgerStats items={[
      { label: "Total consultado", value: valor(total()), icon: Wallet },
      { label: "Tarifa anual", value: valor(total("tarifa_anual")), icon: FileText },
      { label: "Compra de chorro", value: valor(total("compra_chorro")), icon: Droplets },
      { label: "Recibos encontrados", value: loading || error ? "—" : filtrados.length, icon: FileText },
    ]} />
    <section className="admin-surface min-w-0"><div className="admin-surface-header"><div><h2>Recibos</h2></div><Button variant="outline" size="sm" disabled={loading || Boolean(error) || !filtrados.length} onClick={exportar}><Download className="size-4" />Exportar CSV</Button></div>
      <form onSubmit={buscar} className="grid items-end gap-3 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_140px_180px_auto]">
        <label className="space-y-2 text-xs font-medium sm:col-span-2 xl:col-span-1"><span>Beneficiario o recibo</span><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-9" placeholder="Nombre, DPI o recibo" aria-label="Buscar facturas" value={q} onChange={(e) => setQ(e.target.value)} /></div></label>
        <label className="space-y-2 text-xs font-medium"><span>Año de pago</span><select className={nativeSelectClass} value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Año de la factura"><option value="">Todos los años</option>{ANIOS.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
        <label className="space-y-2 text-xs font-medium"><span>Concepto</span><select className={nativeSelectClass} value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }} aria-label="Concepto de pago"><option value="">Todos los conceptos</option><option value="tarifa_anual">Tarifa anual</option><option value="compra_chorro">Compra de chorro</option></select></label>
        <Button type="submit" disabled={loading} className="h-11"><Filter className="size-4" />Buscar</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border bg-muted/30 px-5 py-3"><p className="text-xs text-muted-foreground" aria-live="polite">{loading ? "Consultando movimientos…" : error ? "Consulta no disponible" : `${filtrados.length} ${filtrados.length === 1 ? "recibo" : "recibos"} · ${consulta.anio || "Todos los años"}${consulta.q ? ` · ${consulta.q}` : ""}`}</p><Button variant="ghost" size="sm" onClick={limpiar} disabled={loading || !(q || anio || tipo || hayFiltro)}>Limpiar filtros</Button></div>
      {loading ? <div className="space-y-4 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : error ? <div role="alert" className="space-y-4 p-6"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void cargar(q, anio)}>Reintentar</Button></div> : !pageItems.length ? <EmptyState className="px-6" title={hayFiltro ? "Sin coincidencias" : "Sin recibos registrados"} description={hayFiltro ? "No hay recibos con estos filtros." : undefined} action={hayFiltro ? <Button variant="outline" onClick={limpiar}>Ver todos los recibos</Button> : <Link href="/facturacion" className={buttonVariants({ variant: "outline" })}>Emitir recibo</Link>} /> : <><ReceiptList recibos={pageItems} onOpen={(r) => setPdf(sourceFromRecibo(r))} /><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5"><p className="text-xs text-muted-foreground">Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtrados.length)} de {filtrados.length}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button><span className="text-xs tabular-nums">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button></div></div></>}
      {recibos.length >= 500 && !loading && !error && <p className="border-t border-border p-5 text-xs text-muted-foreground">Consulta limitada a los 500 recibos más recientes. Filtra para ver otros periodos.</p>}
    </section>
    <ReciboPdfViewer source={pdf} onClose={() => setPdf(null)} />
  </PageStack>;
}
