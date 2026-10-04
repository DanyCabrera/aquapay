"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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
  const [abierto, setAbierto] = useState<string | null>(null);

  async function cargar(search = q, year = anio) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "500" });
      if (search.trim()) qs.set("q", search.trim());
      if (year) qs.set("anio", year);
      setRecibos(await api<Recibo[]>(`/api/facturacion/recibos?${qs}`));
    } catch (err) {
      setRecibos([]);
      toast.error(err instanceof ApiError ? err.message : "No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
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
      <PageIntro description="Quienes ya pagaron en la aldea. Filtre por nombre, DPI o año." />

      <form
        onSubmit={onBuscar}
        className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"
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
      ) : pagadores.length === 0 ? (
        <EmptyState
          title={q.trim() ? "Nadie coincide con esa búsqueda" : "Nadie ha pagado aún"}
          description={
            q.trim()
              ? "Pruebe otro nombre, DPI o año."
              : "Cuando el tesorero emita un recibo, la persona aparecerá aquí."
          }
        />
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
                          {r.pdf?.urlPublica ? (
                            <a
                              href={r.pdf.urlPublica}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary transition-ui hover:underline"
                            >
                              Abrir
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
    </PageStack>
  );
}
