import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

export function PageBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-ui hover:text-foreground active:scale-[0.98]"
    >
      <ArrowLeft className="size-3.5" />
      {children}
    </Link>
  );
}

export function PageIntro({
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  if (!description && !action) return null;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      {description ? (
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      ) : (
        <span />
      )}
      {action ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{action}</div>
      ) : null}
    </div>
  );
}
