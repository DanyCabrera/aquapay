"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "./top-bar";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 bg-sidebar" />
        <div className="space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
      >
        Saltar al contenido
      </a>
      <TopBar />
      <main
        id="contenido"
        className="px-4 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-10"
      >
        {children}
      </main>
    </div>
  );
}
