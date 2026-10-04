import { cn } from "@/lib/utils";

const styles = {
  pagado: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  vencido: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  activo: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  inactivo: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
} as const;

const labels = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  vencido: "Vencido",
  activo: "Activo",
  inactivo: "Inactivo",
} as const;

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: keyof typeof labels;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        styles[status],
        className,
      )}
    >
      {children ?? labels[status]}
    </span>
  );
}
