import { cn } from "@/lib/utils";

export type LedgerStat = {
  label: string;
  value: string | number;
};

/**
 * Tira de cifras: una sola hoja dividida por filetes, no cinco tarjetas
 * flotando. Los márgenes negativos dejan que los filetes del último borde
 * se salgan y los recorte el contenedor, así la retícula puede envolver en
 * móvil sin dibujar líneas sueltas.
 */
export function LedgerStats({
  items,
  className,
}: {
  items: LedgerStat[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card",
        className,
      )}
    >
      <dl className="-mr-px -mb-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 border-r border-b border-border px-5 py-4"
          >
            <dt className="text-caption text-muted-foreground">{item.label}</dt>
            <dd className="mt-1.5 truncate font-mono text-2xl leading-none font-semibold tracking-tight">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
