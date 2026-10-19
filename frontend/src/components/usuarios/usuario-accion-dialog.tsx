"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { ApiError } from "@/lib/api";
import { formatDpi } from "@/lib/format";
import type { UsuarioComunidad } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type UsuarioAccion = "activar" | "desactivar" | "eliminar";
export type UsuarioAccionPendiente = { usuario: UsuarioComunidad; accion: UsuarioAccion };

const ACCIONES = {
  activar: {
    titulo: "¿Activar beneficiario?",
    descripcion: "Volverá a estar disponible para registrar nuevos cobros.",
    boton: "Sí, activar",
    progreso: "Activando…",
    icono: UserRoundCheck,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    nota: "Sus viviendas, chorros e historial se mantienen.",
  },
  desactivar: {
    titulo: "¿Desactivar beneficiario?",
    descripcion: "No podrá seleccionarse para nuevos cobros mientras esté inactivo.",
    boton: "Sí, desactivar",
    progreso: "Desactivando…",
    icono: UserRoundX,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    nota: "Podrá activarlo nuevamente cuando lo necesite.",
  },
  eliminar: {
    titulo: "¿Eliminar beneficiario?",
    descripcion: "Se eliminarán sus datos, viviendas y chorros. Esta acción no se puede deshacer.",
    boton: "Sí, eliminar",
    progreso: "Eliminando…",
    icono: Trash2,
    color: "bg-destructive/10 text-destructive",
    nota: "Si tiene recibos o pagos asociados, deberá desactivarlo para conservar su historial.",
  },
} as const;

export function UsuarioAccionDialog({ pendiente, onClose, onConfirm }: {
  pendiente: UsuarioAccionPendiente | null;
  onClose: () => void;
  onConfirm: (pendiente: UsuarioAccionPendiente) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contenido = ACCIONES[pendiente?.accion ?? "desactivar"];
  const Icono = contenido.icono;

  function cerrar() {
    if (busy) return;
    setError(null);
    onClose();
  }

  async function confirmar() {
    if (!pendiente || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(pendiente);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la acción. Intente nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!pendiente} onOpenChange={(open) => { if (!open) cerrar(); }}>
      <DialogContent role="alertdialog" showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="space-y-5 p-6 sm:p-7">
          <div className={cn("flex size-14 items-center justify-center rounded-2xl", contenido.color)}>
            <Icono className="size-6" aria-hidden />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl">{contenido.titulo}</DialogTitle>
            <DialogDescription className="leading-relaxed">{contenido.descripcion}</DialogDescription>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="break-words font-semibold">{pendiente?.usuario.nombreCompleto}</p>
            <p className="mt-1 font-mono text-caption text-muted-foreground">DPI {formatDpi(pendiente?.usuario.dpi ?? "")}</p>
          </div>
          <p className="flex items-start gap-2 text-caption leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            {contenido.nota}
          </p>
          {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button variant="outline" disabled={busy} onClick={cerrar}>Cancelar</Button>
          <Button
            variant={pendiente?.accion === "eliminar" ? "destructive" : "default"}
            disabled={busy}
            onClick={() => void confirmar()}
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {busy ? contenido.progreso : contenido.boton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
