"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Droplets,
  Plus,
  Receipt,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { formatEntero, formatQuetzales } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCIONES = [
  {
    href: "/usuarios/nuevo",
    label: "Registrar beneficiario",
    hint: "Persona, vivienda y chorro",
    icon: Plus,
  },
  {
    href: "/pagos",
    label: "Consultar pago",
    hint: "¿Ya pagó esta persona?",
    icon: Search,
  },
  {
    href: "/usuarios",
    label: "Ver el padrón",
    hint: "Buscar, abrir ficha o desactivar",
    icon: Users,
  },
  {
    href: "/configuracion",
    label: "Cambiar tarifa",
    hint: "Precio anual por chorro",
    icon: CircleDollarSign,
  },
] as const;

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api<DashboardData>("/api/facturacion/dashboard").then(setData).catch(console.error);
  }, []);

  return (
    <PageStack>
      <PageIntro
        description="Estado de la aldea este mes. Abra una cifra o elija el siguiente paso."
        action={
          <Link href="/usuarios/nuevo" className={cn(buttonVariants(), "rounded-full")}>
            <Plus className="size-4" />
            Registrar
          </Link>
        }
      />

      <LedgerStats
        items={[
          {
            label: "Tarifa anual",
            value: data ? formatQuetzales(data.ingresosMesTarifa ?? 0) : "—",
            hint: "este mes · ver reporte",
            icon: Receipt,
            href: "/reportes",
          },
          {
            label: "Compra de chorro",
            value: data ? formatQuetzales(data.ingresosMesChorro ?? 0) : "—",
            hint: "este mes · ver reporte",
            icon: Droplets,
            href: "/reportes",
          },
          {
            label: "Total cobrado",
            value: data ? formatQuetzales(data.ingresosMes) : "—",
            hint: "este mes · ver reporte",
            icon: Wallet,
            href: "/reportes",
          },
          {
            label: "Beneficiarios",
            value: data ? formatEntero(data.totalUsuarios) : "—",
            hint: `${data ? formatEntero(data.facturasMes) : "—"} recibos · ver padrón`,
            icon: Users,
            href: "/usuarios",
          },
        ]}
      />

      <section>
        <h2 className="mb-3">Siguientes pasos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ACCIONES.map((accion) => {
            const Icon = accion.icon;
            return (
              <Link
                key={accion.href}
                href={accion.href}
                className="flex items-center gap-3.5 rounded-2xl border border-border px-5 py-4 transition-ui hover:bg-muted/40 active:scale-[0.99]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{accion.label}</span>
                  <span className="mt-0.5 block text-caption text-muted-foreground">
                    {accion.hint}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </PageStack>
  );
}
