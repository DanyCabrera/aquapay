"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth/auth-shell";

export default function MfaSetupPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    router.replace(user ? "/dashboard" : "/login");
  }, [router, user]);

  return (
    <AuthShell>
      <h1>Verificación</h1>
      <p className="mt-3 text-caption text-muted-foreground">Redirigiendo…</p>
    </AuthShell>
  );
}
