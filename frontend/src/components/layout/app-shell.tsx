"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppSidebar, ContentHeader } from "./sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const TITULOS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/facturacion": "Emitir",
  "/historial": "Historial",
  "/usuarios": "Beneficiarios",
  "/usuarios/nuevo": "Registrar",
  "/pagos": "Consultar pago",
  "/reportes": "Reportes",
  "/configuracion": "Tarifa",
};

function tituloDeRuta(pathname: string) {
  if (/^\/usuarios\/(?!nuevo(?:\/|$))[^/]+/.test(pathname)) {
    return "Ficha";
  }
  return (
    Object.entries(TITULOS)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([href]) => pathname === href || pathname.startsWith(`${href}/`))?.[1] ??
    "AquaPay"
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router, pathname]);

  const titulo = tituloDeRuta(pathname);

  if (loading || !user) {
    return (
      <div className="flex h-svh overflow-hidden bg-card">
        <Skeleton className="hidden h-full w-60 lg:block" />
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-svh overflow-hidden bg-card">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
      >
        Saltar al contenido
      </a>
      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ContentHeader title={titulo} />
          <main
            id="contenido"
            className="min-h-0 flex-1 overflow-auto overscroll-contain px-5 pb-10 pt-6 sm:px-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
