"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        // Bordes y texto en currentColor: sirve igual sobre la barra oscura
        // que sobre el fondo claro del login.
        "inline-flex items-center justify-center rounded-md border border-current/25 text-[0.75rem] opacity-75 transition-ui hover:opacity-100",
        compact ? "h-8 min-w-8 px-2" : "h-8 px-2.5",
        className,
      )}
      aria-label={isDark ? "Usar tema claro" : "Usar tema oscuro"}
    >
      {compact ? (isDark ? "Claro" : "Oscuro") : isDark ? "Tema claro" : "Tema oscuro"}
    </button>
  );
}
