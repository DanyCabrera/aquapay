"use client";

import { useEffect, useState } from "react";
import { Download, Wallet, Users, Home, Receipt } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
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
import { cn } from "@/lib/utils";

type Tipo = "usuarios" | "viviendas" | "pagos" | "ingresos";

interface ReporteData {
  titulo: string;
  columnas: string[];
  filas: string[][];
  serie?: { mes: number; total: number }[];
}

export default function ReportesPage() {
  const [tipo, setTipo] = useState<Tipo>("ingresos");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [data, setData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargar(t = tipo, a = anio) {
    setLoading(true);
    try {
      const q = t === "usuarios" || t === "viviendas" ? "" : `?anio=${a}`;
      setData(await api<ReporteData>(`/api/reportes/${t}${q}`));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function exportarPdf() {
    try {
      const token =
        sessionStorage.getItem("aquapay_token") ??
        localStorage.getItem("aquapay_token");
      const q =
        tipo === "usuarios" || tipo === "viviendas" ? "" : `?anio=${anio}`;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reportes/${tipo}/pdf${q}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("No se pudo exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${tipo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al exportar PDF");
    }
  }

  return (
    <PageStack>
      <PageIntro
        title="Reportes"
        description="Cifras de toda la aldea. Para una persona, use Consultar pago."
        action={
          <Button type="button" variant="outline" className="rounded-full" onClick={exportarPdf}>
            <Download className="size-4" />
            Exportar PDF
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {(
          [
            ["ingresos", "Ingresos", Wallet],
            ["pagos", "Recibos", Receipt],
            ["usuarios", "Usuarios", Users],
            ["viviendas", "Viviendas", Home],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm transition-ui",
              tipo === value
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
            onClick={() => {
              setTipo(value);
              cargar(value, anio);
            }}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
        {(tipo === "ingresos" || tipo === "pagos") && (
          <Input
            className="h-10 w-24 font-mono"
            type="number"
            value={anio}
            onChange={(e) => {
              const a = Number(e.target.value);
              setAnio(a);
              cargar(tipo, a);
            }}
            aria-label="Año del reporte"
          />
        )}
      </div>

      {loading ? (
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-border py-3.5 last:border-b-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="hidden h-4 w-28 sm:block" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <EmptyState title="Sin datos" />
      ) : (
        <div>
          <h2 className="mb-3">{data.titulo}</h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {data.columnas.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.filas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={data.columnas.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Sin filas
                    </TableCell>
                  </TableRow>
                ) : (
                  data.filas.map((fila, i) => (
                    <TableRow key={i}>
                      {fila.map((celda, j) => (
                        <TableCell
                          key={j}
                          className={cn(
                            j === 0 ? "font-medium" : "text-muted-foreground",
                            "font-mono text-caption tabular-nums",
                          )}
                        >
                          {celda}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </PageStack>
  );
}
