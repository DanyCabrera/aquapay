import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium leading-none",
  {
    variants: {
      status: {
        pagado:
          "border-success/30 bg-success/10 text-success",
        pendiente:
          "border-warning/35 bg-warning/10 text-foreground",
        vencido:
          "border-destructive/30 bg-destructive/10 text-destructive",
        activo:
          "border-success/30 bg-success/10 text-success",
        inactivo:
          "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "pendiente",
    },
  },
);

const labels: Record<
  NonNullable<VariantProps<typeof statusBadgeVariants>["status"]>,
  string
> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  vencido: "Vencido",
  activo: "Activo",
  inactivo: "Inactivo",
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: NonNullable<VariantProps<typeof statusBadgeVariants>["status"]>;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {children ?? labels[status]}
    </span>
  );
}
