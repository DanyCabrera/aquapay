import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type LedgerStat = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  delta?: string;
  href?: string;
};

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
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon ?? Info;
        const card = (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">
              {item.value}
            </p>
            {item.hint || item.delta ? (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {item.delta ? (
                  <span className="mr-1 font-medium text-success">{item.delta}</span>
                ) : null}
                {item.hint}
              </p>
            ) : null}
          </>
        );
        const classNameCard =
          "rounded-2xl border border-border bg-card p-5 shadow-sm";
        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(classNameCard, "transition-ui hover:bg-muted/40 active:scale-[0.99]")}
            >
              {card}
            </Link>
          );
        }
        return (
          <div key={item.label} className={classNameCard}>
            {card}
          </div>
        );
      })}
    </div>
  );
}
