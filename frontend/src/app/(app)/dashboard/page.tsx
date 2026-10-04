"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Droplets,
  FileText,
  Plus,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardData } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { LedgerStats } from "@/components/layout/ledger-stats";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { formatEntero, formatQuetzales } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  return (
    <PageStack>
      <PageIntro
        action={
          <Link href="/facturacion" className={cn(buttonVariants(), "rounded-full")}>
            <Plus className="size-4" />
            Emitir
          </Link>
        }
      />

      <LedgerStats
        items={[
          {
            label: "Tarifa anual",
            value: data ? formatQuetzales(data.ingresosMesTarifa ?? 0) : "—",
            hint: "este mes",
            icon: Receipt,
          },
          {
            label: "Compra de chorro",
            value: data ? formatQuetzales(data.ingresosMesChorro ?? 0) : "—",
            hint: "este mes",
            icon: Droplets,
          },
          {
            label: "Total",
            value: data ? formatQuetzales(data.ingresosMes) : "—",
            hint: "este mes",
            icon: Wallet,
          },
          {
            label: "Recibos",
            value: data ? formatEntero(data.facturasMes) : "—",
            hint: "emitidos este mes",
            icon: FileText,
          },
        ]}
      />
    </PageStack>
  );
}
