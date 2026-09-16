"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { DashboardData, UsuarioComunidad } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { Surface } from "@/components/layout/page-header";
import { formatEntero, formatQuetzales } from "@/lib/format";

const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} minuto${mins === 1 ? "" : "s"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} hora${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days === 1 ? "" : "s"}`;
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioComunidad[]>([]);

  useEffect(() => {
    api<DashboardData>("/api/facturacion/dashboard").then(setData).catch(console.error);
    api<UsuarioComunidad[]>("/api/usuarios").then(setUsuarios).catch(console.error);
  }, []);

  const chart = useMemo(
    () =>
      (data?.ingresosPorMes ?? []).map((r) => ({
        name: meses[r.mes - 1],
        total: r.total,
      })),
    [data],
  );

  const actividad = useMemo(() => {
    const items: {
      id: string;
      title: string;
      detail: string;
      when: string;
    }[] = [];

    const sorted = [...usuarios].sort(
      (a, b) =>
        new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime(),
    );

    for (const u of sorted.slice(0, 6)) {
      items.push({
        id: `u-${u.id}`,
        title: u.activo ? "Registrado" : "Desactivado",
        detail: u.nombreCompleto,
        when: formatRelative(u.fechaRegistro),
      });
    }

    return items.slice(0, 5);
  }, [usuarios]);

  const kpis = data
    ? [
        { label: "Beneficiarios", value: formatEntero(data.totalUsuarios) },
        { label: "Viviendas", value: formatEntero(data.totalViviendas) },
        { label: "Chorros", value: formatEntero(data.totalChorros ?? 0) },
        { label: "Facturas del mes", value: formatEntero(data.facturasMes) },
        { label: "Ingresos del mes", value: formatQuetzales(data.ingresosMes) },
      ]
    : [];

  return (
    <PageStack>
      <PageIntro
        title="Resumen"
        description="Beneficiarios y cobros de Aldea Sibaná."
        action={
          <Link
            href="/usuarios/nuevo"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-ui hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_14%)]"
          >
            Registrar beneficiario
          </Link>
        }
      />

      {!data ? (
        <Skeleton className="h-[5.75rem] w-full rounded-md" />
      ) : (
        <LedgerStats items={kpis} />
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Surface className="p-6 lg:col-span-3">
          <h2>Ingresos por mes</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Facturas emitidas este año.
          </p>
          <div className="mt-5 h-64 min-w-0">
            {chart.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-base text-muted-foreground">
                  Todavía no hay recibos este año.
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

        <Surface className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
            <h2>Altas recientes</h2>
            <Link
              href="/usuarios"
              className="text-caption text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {actividad.length === 0 ? (
            <p className="px-5 py-5 text-sm text-muted-foreground">
              Todavía no hay beneficiarios. El primer registro aparece aquí.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {actividad.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.detail}</p>
                    <p className="text-caption text-muted-foreground">
                      {item.title}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-caption text-muted-foreground">
                    {item.when}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </PageStack>
  );
}
