"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { PageHeader, Surface } from "@/components/layout/page-header";
import { formatQuetzales } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tipo = "usuarios" | "viviendas" | "pagos" | "ingresos";

interface ReporteData {
  titulo: string;
  columnas: string[];
  filas: string[][];
  serie?: { mes: number; total: number }[];
}

const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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

  const chart = (data?.serie ?? []).map((r) => ({
    name: meses[r.mes - 1],
    total: r.total,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Tablas de cobros y listados. Puede bajarlas en PDF."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Reportes" },
        ]}
        actions={
          <Button variant="outline" onClick={exportarPdf}>
            Exportar PDF
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["ingresos", "Ingresos"],
            ["pagos", "Pagos"],
            ["usuarios", "Usuarios"],
            ["viviendas", "Viviendas"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={tipo === value ? "default" : "outline"}
            onClick={() => {
              setTipo(value);
              cargar(value, anio);
            }}
          >
            {label}
          </Button>
        ))}
        {(tipo === "ingresos" || tipo === "pagos") && (
          <Input
            className="h-8 w-24 text-[0.8rem]"
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

      {tipo === "ingresos" && chart.length > 0 && (
        <Surface className="h-64 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
                formatter={(v) => [formatQuetzales(Number(v)), "Total"]}
              />
              <Bar
                dataKey="total"
                fill="var(--chart-1)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Surface>
      )}

      {!loading && !data ? (
        <EmptyState
          title="Sin datos"
          description="No hay información para este reporte."
        />
      ) : data ? (
        <Surface className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2>{data.titulo}</h2>
          </div>
          <div className="overflow-x-auto">
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
                      Sin filas para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  data.filas.map((fila, i) => (
                    <TableRow key={i} className="transition-ui">
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
        </Surface>
      ) : null}
    </div>
  );
}
