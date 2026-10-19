"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  blobFromBase64Pdf,
  downloadBlob,
  fetchReciboPdf,
} from "@/lib/api";
import { formatRecibo } from "@/lib/format";
import type { Recibo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ReciboPdfSource = {
  reciboId: string;
  titulo?: string;
  nombreArchivo?: string;
  base64?: string;
};

export function sourceFromRecibo(
  recibo: Pick<Recibo, "id" | "numeroRecibo" | "pdf">,
  extra?: Partial<ReciboPdfSource>,
): ReciboPdfSource {
  return {
    reciboId: recibo.id,
    titulo: `Recibo ${formatRecibo(recibo.numeroRecibo)}`,
    nombreArchivo:
      recibo.pdf?.nombreArchivo ?? `recibo-${recibo.numeroRecibo}.pdf`,
    ...extra,
  };
}

export function ReciboPdfViewer({
  source,
  onClose,
}: {
  source: ReciboPdfSource | null;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activo, setActivo] = useState<ReciboPdfSource | null>(source);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(source);
  const titulo = activo?.titulo ?? "Recibo";
  const filename = activo?.nombreArchivo ?? "recibo.pdf";

  useEffect(() => {
    if (source) setActivo(source);
  }, [source]);

  useEffect(() => {
    if (!source) return;
    const pdfSource = source;

    let cancelled = false;
    let objectUrl: string | null = null;

    async function cargar() {
      setLoading(true);
      setError(null);
      setBlob(null);
      setUrl(null);
      try {
        const pdf = pdfSource.base64
          ? blobFromBase64Pdf(pdfSource.base64)
          : await fetchReciboPdf(pdfSource.reciboId);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(pdf);
        setBlob(pdf);
        setUrl(objectUrl);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la vista previa del recibo.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void cargar();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  function descargar() {
    if (!blob) return;
    downloadBlob(blob, filename);
  }

  function imprimir() {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) {
      toast.error("Espere a que cargue la vista previa.");
      return;
    }
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="flex h-[min(90svh,880px)] max-h-[90svh] w-full max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 px-5 pt-5 pr-12 pb-3">
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Vista previa lista para imprimir. También puede descargar el PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 px-5 pb-1">
          {loading ? (
            <div className="flex h-full min-h-70 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/40 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Cargando vista previa…</p>
            </div>
          ) : error ? (
            <div className="flex h-full min-h-70 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-6 text-center">
              <p className="text-sm font-medium">No se pudo mostrar el PDF</p>
              <p className="text-caption text-muted-foreground">{error}</p>
            </div>
          ) : url ? (
            <iframe
              ref={iframeRef}
              src={`${url}#toolbar=1&navpanes=0&view=FitH`}
              title={`Vista previa de ${titulo}`}
              className="h-full min-h-70 w-full rounded-xl border border-border bg-white"
            />
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!blob}
            onClick={imprimir}
          >
            <Printer />
            Imprimir
          </Button>
          <Button type="button" disabled={!blob} onClick={descargar}>
            <Download />
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
