import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  subtitle,
  collapsed = false,
  className,
}: {
  subtitle?: string;
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Droplets className="size-5" />
      </span>
      {collapsed ? null : (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">AquaPay</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {subtitle ?? "Aldea Sibaná"}
          </p>
        </div>
      )}
    </div>
  );
}
