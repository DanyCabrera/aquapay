"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Recibo } from "@/lib/types";
import { formatRecibo, formatQuetzales } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export function EliminarReciboDialog({ recibo, onClose, onDeleted }: {
  recibo: Recibo | null; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<Recibo | null>(null);
  useEffect(() => { if (recibo) { setVista(recibo); setError(""); } }, [recibo]);
  function cerrar() { if (!busy) { setError(""); onClose(); } }
  async function eliminar() {
    if (!recibo || busy) return;
    setBusy(true); setError("");
    try {
      const data = await api<{
        id: string;
        siguiente?: { numeroRecibo: string };
      }>(`/api/facturacion/recibos/${recibo.id}`, { method: "DELETE" });
      onDeleted(recibo.id); onClose();
      toast.success(
        data.siguiente
          ? `Recibo eliminado. Siguiente correlativo: ${formatRecibo(data.siguiente.numeroRecibo)}`
          : "Recibo eliminado",
      );
    } catch (e) { setError(e instanceof ApiError ? e.message : "No se pudo eliminar el recibo."); }
    finally { setBusy(false); }
  }
  return <Dialog open={!!recibo} onOpenChange={(open) => { if (!open) cerrar(); }}>
    <DialogContent role="alertdialog" showCloseButton={false}>
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 /></span>
      <DialogTitle>Eliminar recibo</DialogTitle>
      <div className="rounded-xl border border-border p-4"><p className="font-semibold">Recibo {formatRecibo(vista?.numeroRecibo)}</p><p className="mt-1 break-words text-sm">{vista?.vivienda?.usuario?.nombreCompleto}</p><p className="mt-2 font-mono">{formatQuetzales(vista?.totalPagado)}</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy} onClick={cerrar}>Cancelar</Button><Button variant="destructive" disabled={busy} onClick={() => void eliminar()}>{busy ? "Eliminando…" : "Sí, eliminar recibo"}</Button></div>
    </DialogContent>
  </Dialog>;
}
