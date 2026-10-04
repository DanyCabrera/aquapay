"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Droplets, FileText, Filter, Plus, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Recibo } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { nativeSelectClass } from "@/components/layout/page-header";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { formatDpi, formatFecha, formatQuetzales, formatRecibo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 12 }, (_, i) => ANIO_ACTUAL - i);

function etiquetaTipo(tipo: Recibo["tipoCobro"]) {
  return tipo === "tarifa_anual" ? "Tarifa anual" : "Compra chorro";
}

export default function HistorialTesoreroPage() {
  const [q, setQ] = useState("");
  const [anio, setAnio] = useState("");
  const [consulta, setConsulta] = useState({ q: "", anio: "" });
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const hayFiltro = Boolean(consulta.q.trim() || consulta.anio);

  async function cargar(search = q, year = anio) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (search.trim()) params.set("q", search.trim());
      if (year) params.set("anio", year);
      setRecibos(await api<Recibo[]>(`/api/facturacion/recibos?${params}`));
      setConsulta({ q: search, anio: year });
      setPage(1);
    } catch (err) {
      setRecibos([]);
      setConsulta({ q: search, anio: year });
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo cargar el historial",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar("", "");
    // Solo carga inicial: filtros se aplican al buscar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onBuscar(e: FormEvent) {
    e.preventDefault();
    cargar(q, anio);
  }

  const totalPages = Math.max(1, Math.ceil(recibos.length / pageSize));
  const pageItems = useMemo(
    () => recibos.slice((page - 1) * pageSize, page * pageSize),
    [recibos, page],
  );

  const ingresos = useMemo(() => {
    let tarifaAnual = 0;
    let compraChorro = 0;
    for (const r of recibos) {
      const monto = Number(r.totalPagado) || 0;
      if (r.tipoCobro === "compra_chorro") compraChorro += monto;
      else tarifaAnual += monto;
    }
    return {
      tarifaAnual,
      compraChorro,
      total: tarifaAnual + compraChorro,
    };
  }, [recibos]);

  return (
    <PageStack>
      <PageIntro
        title="Historial"
        action={
          <Link href="/facturacion" className={cn(buttonVariants(), "rounded-full")}>
            <Plus className="size-4" />
            Emitir
          </Link>
        }
      />

      {!loading && recibos.length > 0 ? (
        <LedgerStats
          items={[
            {
              label: "Tarifa anual",
              value: formatQuetzales(ingresos.tarifaAnual),
              icon: FileText,
              hint: "en este listado",
            },
            {
              label: "Compra de chorro",
              value: formatQuetzales(ingresos.compraChorro),
              icon: Droplets,
              hint: "en este listado",
            },
            {
              label: "Total",
              value: formatQuetzales(ingresos.total),
              icon: Wallet,
              hint: `${recibos.length} recibos`,
            },
          ]}
        />
      ) : null}

      <div>
        <form
          onSubmit={onBuscar}
          className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"
        >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-full pl-10"
                placeholder="Nombre, DPI o recibo"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar facturas"
              />
            </div>
            <select
              className={cn(nativeSelectClass, "h-10")}
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              aria-label="Año de la factura"
            >
              <option value="">Todos los años</option>
              {ANIOS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="h-10 rounded-full">
              <Filter className="size-4" />
              Buscar
            </Button>
          </form>

        {loading ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-6 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="hidden h-4 w-28 sm:block" />
                <Skeleton className="hidden h-4 w-24 sm:block" />
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="px-5">
            <EmptyState
              title={hayFiltro ? "Sin coincidencias" : "Sin facturas"}
              action={
                hayFiltro ? undefined : (
                  <Link href="/facturacion" className={cn(buttonVariants())}>
                    Emitir
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-2 overflow-hidden rounded-2xl border border-border">
              <div className="overflow-x-auto">
              <table className="w-full min-w-215 text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-caption font-medium text-muted-foreground">
                    <th className="px-5 py-3.5">Recibo</th>
                    <th className="px-5 py-3.5">Beneficiario</th>
                    <th className="px-5 py-3.5">DPI</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Tipo</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-b-0 transition-ui hover:bg-muted/40"
                    >
                      <td className="px-5 py-3.5 font-mono tabular-nums">
                        {formatRecibo(r.numeroRecibo)}
                      </td>
                      <td className="max-w-60 truncate px-5 py-3.5">
                        {r.vivienda?.usuario?.nombreCompleto ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-caption whitespace-nowrap text-muted-foreground">
                        {r.vivienda?.usuario?.dpi
                          ? formatDpi(r.vivienda.usuario.dpi)
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-caption text-muted-foreground">
                        {formatFecha(r.fechaPago)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            r.tipoCobro === "tarifa_anual"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                              : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
                          )}
                        >
                          {etiquetaTipo(r.tipoCobro)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-sm tabular-nums">
                        {formatQuetzales(r.totalPagado)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-caption text-muted-foreground">
                Mostrando {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, recibos.length)} de {recibos.length}{" "}
                facturas.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="min-w-16 text-center text-caption tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </PageStack>
  );
}
