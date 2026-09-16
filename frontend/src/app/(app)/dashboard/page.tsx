"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardData } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { Surface } from "@/components/layout/page-header";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { formatQuetzales, formatEntero } from "@/lib/format";
import { cn } from "@/lib/utils";

const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (user?.rol === "administrador") return;
    api<DashboardData>("/api/facturacion/dashboard").then(setData).catch(console.error);
  }, [user?.rol]);

  if (user?.rol === "administrador") {
    return <AdminDashboard />;
  }

  const chart = (data?.ingresosPorMes ?? []).map((r) => ({
    name: meses[r.mes - 1],
    total: r.total,
  }));

  const metrics = data
    ? [
        { label: "Usuarios activos", value: formatEntero(data.totalUsuarios) },
        { label: "Viviendas", value: formatEntero(data.totalViviendas) },
        { label: "Facturas del mes", value: formatEntero(data.facturasMes) },
        { label: "Ingresos del mes", value: formatQuetzales(data.ingresosMes) },
        { label: "Tarifa anual", value: formatQuetzales(data.tarifaAnual) },
      ]
    : [];

  return (
    <PageStack>
      <PageIntro
        title="Cobros"
        description="Resumen de Aldea Sibaná. El siguiente paso es emitir el recibo."
        action={
          <Link href="/facturacion" className={cn(buttonVariants())}>
            Emitir recibo
          </Link>
        }
      />

      {!data ? (
        <Skeleton className="h-[5.75rem] w-full rounded-md" />
      ) : (
        <LedgerStats items={metrics} />
      )}

      <Surface className="p-6">
        <h2>Ingresos por mes</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Total cobrado este año, mes a mes.
        </p>
        <div className="mt-5 h-64 min-w-0">
          {chart.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="max-w-prose text-center text-base text-muted-foreground">
                Todavía no hay cobros este año. Emita el primer recibo para ver
                la curva.
              </p>
            </div>
          ) : (
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
                  formatter={(v) => [formatQuetzales(Number(v)), "Ingresos"]}
                />
                <Bar
                  dataKey="total"
                  fill="var(--chart-1)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Surface>
    </PageStack>
  );
}
