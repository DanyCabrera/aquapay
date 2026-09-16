import { cn } from "@/lib/utils";

/** Hereda el color del contenedor para poder vivir sobre la barra oscura
 *  y sobre el fondo claro del login sin dos variantes. */
export function BrandMark({
  subtitle,
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 leading-tight", className)}>
      <p className="truncate text-[0.9375rem] font-semibold tracking-tight">
        AquaPay
      </p>
      {subtitle ? (
        <p className="truncate text-[0.6875rem] opacity-60">{subtitle}</p>
      ) : null}
    </div>
  );
}
