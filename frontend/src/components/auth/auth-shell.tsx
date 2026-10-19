"use client";

import Image from "next/image";
import { Droplets, FileText, MapPin, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({ children, mode = "login" }: { children: React.ReactNode; mode?: "login" | "registro" }) {
  return (
    <div className="admin-workspace flex min-h-svh flex-col bg-background text-foreground" data-auth-mode={mode}>
      <header className="mx-auto flex w-full max-w-[1160px] shrink-0 items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
        <BrandMark />
        <div className="flex items-center gap-5"><span className="hidden text-[11px] text-muted-foreground sm:block">Gestión comunitaria del agua</span><ThemeToggle /></div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-8 sm:py-6">
        <div className="auth-layout grid w-full max-w-[460px] overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_16px_70px_-35px_#192b4620] lg:max-w-[1080px] lg:grid-cols-[1.05fr_1fr]">
          <section aria-label="Acerca de AquaPay" className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-muted/25 p-8 lg:flex xl:p-10">
            <div className="relative z-10"><span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Hecho para nuestra comunidad</span><h2 className="mt-7 max-w-80 text-[42px] font-semibold leading-[1.12] tracking-tight">El agua nos<br /><span className="text-primary">conecta.</span></h2><p className="mt-4 max-w-72 text-sm leading-relaxed text-muted-foreground">La gestión del servicio de agua de Aldea Sibaná, en un solo lugar.</p></div>
            <div aria-hidden="true" className="relative mx-auto my-4 flex h-48 w-full max-w-80 items-center justify-center">
              <div className="absolute size-52 rounded-full border border-primary/10" /><div className="absolute size-36 rounded-full border border-dashed border-primary/15" />
              <div className="relative flex size-28 items-center justify-center rounded-[32px] border border-border bg-card shadow-[0_12px_32px_-12px_#315fe933]"><Image src="/logo.png" alt="" width={88} height={88} className="size-22 object-contain" /></div>
              <span className="absolute left-0 top-7 flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-primary"><Users className="size-5" /></span><span className="absolute right-0 bottom-8 flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-primary"><FileText className="size-5" /></span><span className="absolute bottom-2 left-12 size-2 rounded-full bg-primary/30" /><span className="absolute right-12 top-3 size-2 rounded-full bg-primary/20" />
            </div>
            <div className="relative z-10 flex flex-wrap gap-2 border-t border-border pt-5">{[{ icon: Users, label: "Beneficiarios" }, { icon: Droplets, label: "Cobros" }, { icon: FileText, label: "Recibos" }].map(({ icon: Icon, label }) => <span key={label} className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-[11px] text-muted-foreground"><Icon className="size-3.5 text-primary" />{label}</span>)}</div>
          </section>
          <section aria-label={mode === "login" ? "Acceso a la cuenta" : "Registro de cuenta"} className="min-w-0 px-6 py-8 sm:px-10 sm:py-10 lg:flex lg:flex-col lg:justify-center lg:px-11">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-primary">{mode === "login" ? "Tu espacio de trabajo" : "Únete a AquaPay"}</p>
            {children}
          </section>
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-[1160px] shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-5 text-[10px] text-muted-foreground sm:px-8"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3" />Aldea Sibaná, El Asintal, Retalhuleu</span><span>Comunidad · Agua · Servicio</span></footer>
    </div>
  );
}
