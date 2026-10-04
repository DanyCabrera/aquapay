import { formatDpi } from "@/lib/format";

export const DPI_LENGTH = 13;

export function formatDpiDisplay(digits: string) {
  return formatDpi(digits, "");
}

export function parseDpiInput(raw: string) {
  return raw.replace(/\D/g, "").slice(0, DPI_LENGTH);
}

export type PasswordStrength = "empty" | "debil" | "media" | "fuerte";

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return "debil";
  if (score <= 4) return "media";
  return "fuerte";
}

// Campos: 44px en táctil, 40px en escritorio. Foco = borde entintado + halo corto.
export const authFieldClass =
  "h-11 rounded-xl border-border bg-muted/50 px-3 text-sm transition-ui md:h-10 " +
  "placeholder:text-muted-foreground " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 " +
  "aria-invalid:border-destructive " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const authSubmitClass =
  "h-11 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-ui md:h-10 " +
  "hover:bg-[color-mix(in_oklch,var(--primary),black_8%)] " +
  "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground";
