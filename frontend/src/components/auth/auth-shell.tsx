"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({
  children,
  mode = "login",
}: {
  children: React.ReactNode;
  mode?: "login" | "registro";
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-sm sm:p-8" data-auth-mode={mode}>
        <div className="mb-8 flex items-center justify-between">
          <BrandMark />
          <ThemeToggle />
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Aldea Sibaná, El Asintal, Retalhuleu
        </p>
      </div>
    </div>
  );
}
