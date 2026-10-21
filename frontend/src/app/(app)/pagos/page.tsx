"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Receipt, Search, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Recibo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { nativeSelectClass } from "@/components/layout/page-header";
import {
  formatDpi,
  formatEntero,
  formatFecha,
  formatQuetzales,
  formatRecibo,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ReciboPdfViewer,
  sourceFromRecibo,
  type ReciboPdfSource,
} from "@/components/facturacion/recibo-pdf-viewer";

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 12 }, (_, i) => ANIO_ACTUAL - i);

type Pagador = {
  usuarioId: string;
  nombre: string;
  dpi: string;
  tarifa: boolean;
  chorro: boolean;
  ultimoPago: string;
  total: number;
  recibos: Recibo[];
};

function agruparPagadores(recibos: Recibo[]): Pagador[] {
  const mapa = new Map<string, Pagador>();

  for (const r of recibos) {
    const usuario = r.vivienda?.usuario;
    const usuarioId = usuario?.id ?? r.vivienda?.usuarioId ?? r.id;
    const actual = mapa.get(usuarioId);
    const monto = Number(r.totalPagado) || 0;
    const fecha = r.fechaPago ?? r.fechaCreacion ?? "";

    if (!actual) {
      mapa.set(usuarioId, {
        usuarioId,
        nombre: usuario?.nombreCompleto ?? "Sin nombre",
        dpi: usuario?.dpi ?? "",
        tarifa: r.tipoCobro === "tarifa_anual",
        chorro: r.tipoCobro === "compra_chorro",
        ultimoPago: fecha,
        total: monto,
        recibos: [r],
      });
      continue;
    }

    actual.recibos.push(r);
    actual.total += monto;
    if (r.tipoCobro === "tarifa_anual") actual.tarifa = true;
    if (r.tipoCobro === "compra_chorro") actual.chorro = true;
    if (fecha && (!actual.ultimoPago || fecha > actual.ultimoPago)) {
      actual.ultimoPago = fecha;
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    (b.ultimoPago || "").localeCompare(a.ultimoPago || ""),
  );
}

function etiquetaTipos(p: Pagador) {
  if (p.tarifa && p.chorro) return "Tarifa y chorro";
  if (p.tarifa) return "Tarifa anual";
  if (p.chorro) return "Compra chorro";
  return "—";
}

export default function PagosPage() {
  return (
    <Suspense>
      <PagosConsulta />
    </Suspense>
  );
}

function PagosConsulta() {
  const params = useSearchParams();
  const dpiParam = params.get("dpi")?.replace(/\D/g, "") ?? "";
  const [q, setQ] = useState(dpiParam);
  const [anio, setAnio] = useState(String(ANIO_ACTUAL));
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [pdfSource, setPdfSource] = useState<ReciboPdfSource | null>(null);
  const consultaRef = useRef(0);

  async function cargar(search = q, year = anio) {
    const consulta = ++consultaRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: "500" });
      if (search.trim()) qs.set("q", search.trim());
      if (year) qs.set("anio", year);
      const result = await api<Recibo[]>(`/api/facturacion/recibos?${qs}`);
      if (consulta === consultaRef.current) setRecibos(result);
    } catch (err) {
      if (consulta !== consultaRef.current) return;
      setRecibos([]);
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los pagos.");
      toast.error(err instanceof ApiError ? err.message : "No se pudieron cargar los pagos");
    } finally {
      if (consulta === consultaRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (dpiParam) setQ(dpiParam);
    void cargar(dpiParam || "", String(ANIO_ACTUAL));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpiParam]);

  function onBuscar(e: FormEvent) {
    e.preventDefault();
    setAbierto(null);
    void cargar(q, anio);
  }

  const pagadores = useMemo(() => agruparPagadores(recibos), [recibos]);

  useEffect(() => {
    if (dpiParam && pagadores.length === 1) {
      setAbierto(pagadores[0].usuarioId);
    }
  }, [dpiParam, pagadores]);

  const seleccionado = pagadores.find((p) => p.usuarioId === abierto) ?? null;

  return (
    <PageStack>
      <PageIntro title="Consulta de pagos" />
      <div className="grid gap-4 sm:grid-cols-3">{[
        { label: "Personas con pago", value: formatEntero(pagadores.length), icon: Users, color: "text-blue-600 bg-blue-500/10" },
        { label: "Recibos en la consulta", value: formatEntero(recibos.length), icon: Receipt, color: "text-violet-600 bg-violet-500/10" },
        { label: "Importe consultado", value: formatQuetzales(recibos.reduce((s, r) => s + Number(r.totalPagado), 0)), icon: Wallet, color: "text-emerald-600 bg-emerald-500/10" },
      ].map(({ label, value, icon: Icon, color }) => <div key={label} className="admin-surface flex items-center gap-4 p-5"><span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", color)}><Icon className="size-5" /></span><div><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{loading || error ? "—" : value}</p></div></div>)}</div>

      <form
        onSubmit={onBuscar}
        className="admin-surface grid items-center gap-3 p-5 sm:grid-cols-[1fr_140px_auto_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-full pl-10"
            placeholder="Nombre o DPI"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar quien ya pagó"
          />
        </div>
        <select
          className={cn(nativeSelectClass, "h-10")}
          value={anio}
          onChange={(e) => {
            setAnio(e.target.value);
            setAbierto(null);
            void cargar(q, e.target.value);
          }}
          aria-label="Año"
        >
          <option value="">Todos los años</option>
          {ANIOS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-10 rounded-full">
          <Search className="size-4" />
          Buscar
        </Button>
        <Button type="button" variant="ghost" disabled={!q && anio === String(ANIO_ACTUAL)} onClick={() => { setQ(""); setAnio(String(ANIO_ACTUAL)); setAbierto(null); void cargar("", String(ANIO_ACTUAL)); }}>Limpiar</Button>
      </form>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-border px-5 py-3.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      ) : error ? <div role="alert" className="admin-surface p-6 text-sm text-destructive">{error}<Button variant="outline" className="ml-3" onClick={() => void cargar()}>Reintentar</Button></div> : pagadores.length === 0 ? (
        <div className="admin-surface p-6"><EmptyState
          className="py-3"
          title={q.trim() ? "Sin coincidencias" : "Sin pagos registrados"}
          description={
            q.trim()
              ? "Pruebe otro nombre, DPI o año."
              : "No hay pagos en el período seleccionado."
          }
          action={<Link href="/usuarios" className="inline-flex items-center gap-2 text-sm font-medium text-primary">Ver beneficiarios <ArrowRight className="size-4" /></Link>}
        /></div>
      ) : (
        <>
          <p className="text-caption text-muted-foreground">
            {`${formatEntero(pagadores.length)} ${
              pagadores.length === 1 ? "persona ya pagó" : "personas ya pagaron"
            }${anio ? ` en ${anio}` : ""}.`}
          </p>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Nombre</TableHead>
                    <TableHead>DPI</TableHead>
                    <TableHead>Qué pagó</TableHead>
                    <TableHead>Último pago</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Recibos</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagadores.map((p) => (
                    <TableRow key={p.usuarioId}>
                      <TableCell className="font-medium">
                        {p.usuarioId && p.nombre !== "Sin nombre" ? (
                          <Link
                            href={`/usuarios/${p.usuarioId}`}
                            className="hover:underline"
                          >
                            {p.nombre}
                          </Link>
                        ) : (
                          p.nombre
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-caption text-muted-foreground">
                        {formatDpi(p.dpi)}
                      </TableCell>
                      <TableCell className="text-caption">{etiquetaTipos(p)}</TableCell>
                      <TableCell className="font-mono text-caption text-muted-foreground">
                        {formatFecha(p.ultimoPago)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {formatQuetzales(p.total)}
                      </TableCell>
                      <TableCell className="font-mono text-caption text-muted-foreground">
                        {formatEntero(p.recibos.length)}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-sm text-primary transition-ui hover:underline"
                          onClick={() =>
                            setAbierto((id) => (id === p.usuarioId ? null : p.usuarioId))
                          }
                        >
                          {abierto === p.usuarioId ? "Ocultar" : "Ver recibos"}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {seleccionado ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold">{seleccionado.nombre}</p>
                  <p className="font-mono text-caption text-muted-foreground">
                    {formatDpi(seleccionado.dpi)}
                  </p>
                </div>
                {seleccionado.usuarioId && seleccionado.nombre !== "Sin nombre" ? (
                  <Link
                    href={`/usuarios/${seleccionado.usuarioId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Abrir ficha
                  </Link>
                ) : null}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Recibo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Tesorero</TableHead>
                      <TableHead>PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seleccionado.recibos.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-caption text-muted-foreground">
                          {formatRecibo(r.numeroRecibo)}
                        </TableCell>
                        <TableCell className="font-mono text-caption text-muted-foreground">
                          {formatFecha(r.fechaPago)}
                        </TableCell>
                        <TableCell className="text-caption">
                          {r.tipoCobro === "tarifa_anual"
                            ? "Tarifa anual"
                            : "Compra chorro"}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {formatQuetzales(r.totalPagado)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.tesorero?.nombre ?? "—"}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setPdfSource(sourceFromRecibo(r))}
                            className="text-sm text-primary transition-ui hover:underline"
                          >
                            Ver PDF
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </>
      )}
      <ReciboPdfViewer source={pdfSource} onClose={() => setPdfSource(null)} />
    </PageStack>
  );
}
