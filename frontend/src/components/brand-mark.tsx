import Image from "next/image";
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
      <Image src="/logo.png" alt="Logo de AquaPay: gota, vivienda y agua" width={44} height={44} className="size-11 shrink-0 object-contain" priority />
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
