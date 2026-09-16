"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

/**
 * Misma barra de pizarra que la app: quien entra ya está viendo el mueble
 * donde va a trabajar. El formulario va en hoja blanca sobre el lienzo, con
 * la misma jerarquía de superficies que el resto del sistema.
 */
export function AuthShell({
  children,
  mode = "login",
}: {
  children: React.ReactNode;
  mode?: "login" | "registro";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between bg-sidebar px-4 text-sidebar-foreground sm:px-6 lg:px-8">
        <BrandMark subtitle="Aldea Sibaná" />
        <ThemeToggle compact />
      </header>

      {/* my-auto en vez de items-center: centra en pantallas altas y deja
          crecer hacia abajo sin recortar el borde superior en las bajas. */}
      <main className="flex flex-1 justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="my-auto w-full max-w-[26rem]" data-auth-mode={mode}>
          <div className="rounded-md border border-border bg-card p-6 sm:p-8">
            {children}
          </div>
        </div>
      </main>

      <footer className="px-4 py-5 text-caption text-muted-foreground sm:px-6 lg:px-8">
        AquaPay · Aldea Sibaná, El Asintal, Retalhuleu
      </footer>
    </div>
  );
}
