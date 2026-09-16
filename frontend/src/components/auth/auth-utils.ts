export const DPI_LENGTH = 13;

export function formatDpiDisplay(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, DPI_LENGTH);
  const p1 = d.slice(0, 4);
  const p2 = d.slice(4, 9);
  const p3 = d.slice(9, 13);
  return [p1, p2, p3].filter(Boolean).join(" ");
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
  "h-11 rounded-md border-border bg-card px-3 text-sm transition-ui md:h-10 " +
  "placeholder:text-muted-foreground " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0 " +
  "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const authSubmitClass =
  "h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-ui md:h-10 " +
  "hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_14%)] " +
  // Deshabilitado con color propio, no con opacidad: apilar opacidad sobre
  // el relleno deja el texto en 1.2:1 y deja de leerse.
  "active:translate-y-px disabled:pointer-events-none " +
  "disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground";
