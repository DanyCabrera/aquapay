"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      duration={4500}
      offset={20}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--card)",
          "--success-text": "var(--success)",
          "--success-border": "var(--border)",
          "--warning-bg": "var(--card)",
          "--warning-text": "var(--warning)",
          "--warning-border": "var(--border)",
          "--error-bg": "var(--card)",
          "--error-text": "var(--destructive)",
          "--error-border":
            "color-mix(in oklch, var(--destructive), transparent 70%)",
        } as CSSProperties
      }
    />
  );
}
