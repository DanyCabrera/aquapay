"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessPath, HOME_ROUTE } from "@/lib/navigation";
import { Skeleton } from "@/components/ui/skeleton";

/** Redirige si el rol actual no puede ver la ruta. */
export function RoleGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowed = canAccessPath(user?.rol, pathname);

  useEffect(() => {
    if (loading || !user) return;
    if (!allowed) {
      router.replace(HOME_ROUTE);
    }
  }, [loading, user, allowed, router]);

  if (loading || !user || !allowed) {
    return (
      <div className="space-y-3 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
