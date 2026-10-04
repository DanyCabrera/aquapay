const dateGt = new Intl.DateTimeFormat("es-GT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatQuetzales(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "Q 0.00";
  const amount = new Intl.NumberFormat("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `Q ${amount}`;
}

export function formatFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateGt.format(d);
}

export function formatEntero(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("es-GT").format(n);
}

/** DPI en grupos 4-5-4: 2487 01000 0101 */
export function formatDpi(
  value: string | null | undefined,
  empty = "—",
) {
  const d = String(value ?? "").replace(/\D/g, "").slice(0, 13);
  if (!d) return empty;
  return [d.slice(0, 4), d.slice(4, 9), d.slice(9, 13)]
    .filter(Boolean)
    .join(" ");
}

/** Recibo con ceros a la izquierda: 047, 2026-047 */
export function formatRecibo(value: string | null | undefined) {
  if (!value) return "—";
  const m = value.match(/^(.*?)(\d+)$/);
  if (!m) return value;
  return `${m[1]}${m[2].padStart(3, "0")}`;
}
