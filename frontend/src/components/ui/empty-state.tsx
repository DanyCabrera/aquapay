import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start py-10", className)}>
      <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </span>
      <h3>{title}</h3>
      {description ? (
        <p className="mt-1.5 text-caption text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
