"use client";

import { useEffect, useState } from "react";
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
    titulo: "¿Eliminar beneficiario y sus recibos?",
    descripcion: "Se eliminarán el beneficiario, sus viviendas, chorros, recibos y pagos asociados. Esta acción no se puede deshacer.",
    boton: "Sí, eliminar",
    progreso: "Eliminando…",
    icono: Trash2,
    color: "bg-destructive/10 text-destructive",
    nota: "El siguiente correlativo será el mayor recibo restante de cada año más uno. Si no queda ninguno, volverá a 001. Los números de los recibos conservados no cambian.",
  },
} as const;

export function UsuarioAccionDialog({ pendiente, onClose, onConfirm }: {
  pendiente: UsuarioAccionPendiente | null;
  onClose: () => void;
  onConfirm: (pendiente: UsuarioAccionPendiente) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmarRecibos, setConfirmarRecibos] = useState(false);
  const [vista, setVista] = useState<UsuarioAccionPendiente | null>(null);
  const contenido = ACCIONES[vista?.accion ?? "desactivar"];
  const Icono = contenido.icono;
  const esEliminar = vista?.accion === "eliminar";

  useEffect(() => {
    if (pendiente) {
      setVista(pendiente);
      setConfirmarRecibos(false);
      setError(null);
    }
  }, [pendiente]);

  function cerrar() {
    if (busy) return;
    setError(null);
    setConfirmarRecibos(false);
    onClose();
  }

  async function confirmar() {
    if (!pendiente || busy) return;
    if (esEliminar && !confirmarRecibos) return;
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
            <p className="break-words font-semibold">{vista?.usuario.nombreCompleto}</p>
            <p className="mt-1 font-mono text-caption text-muted-foreground">DPI {formatDpi(vista?.usuario.dpi ?? "")}</p>
          </div>
          {esEliminar ? (
            <label className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-destructive"
                checked={confirmarRecibos}
                onChange={(e) => setConfirmarRecibos(e.target.checked)}
              />
              <span>También eliminar sus recibos. El siguiente correlativo será el mayor restante del año más uno, o 001 si no queda ninguno. Los números de los recibos conservados no cambian.</span>
            </label>
          ) : (
            <p className="flex items-start gap-2 text-caption leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              {contenido.nota}
            </p>
          )}
          {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button variant="outline" disabled={busy} onClick={cerrar}>Cancelar</Button>
          <Button
            variant={esEliminar ? "destructive" : "default"}
            disabled={busy || !pendiente || (esEliminar && !confirmarRecibos)}
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
