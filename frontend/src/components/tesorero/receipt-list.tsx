"use client";

import { FileText, ArrowUpRight } from "lucide-react";
import type { Recibo } from "@/lib/types";
import { formatDpi, formatFecha, formatQuetzales, formatRecibo } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function ReceiptList({ recibos, onOpen }: { recibos: Recibo[]; onOpen: (recibo: Recibo) => void }) {
  return <>
    <div className="divide-y divide-border md:hidden">{recibos.map((r) => <article key={r.id} className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-semibold text-primary">{formatRecibo(r.numeroRecibo)}</span><span className="text-xs text-muted-foreground">{formatFecha(r.fechaPago)}</span></div>
      <p className="break-words text-sm font-semibold">{r.vivienda?.usuario?.nombreCompleto ?? "Beneficiario no disponible"}</p>
      <p className="text-xs text-muted-foreground">{r.tipoCobro === "tarifa_anual" ? "Tarifa anual" : "Compra de chorro"}</p>
      <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-lg tabular-nums">{formatQuetzales(r.totalPagado)}</strong><Button variant="outline" size="sm" onClick={() => onOpen(r)}><FileText className="size-4" />Ver PDF</Button></div>
    </article>)}</div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-xs"><thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th className="px-5">Recibo / fecha</th><th className="px-5">Beneficiario</th><th className="px-5">Concepto</th><th className="px-5 text-right">Monto</th><th className="px-5 text-right">Documento</th></tr></thead><tbody className="divide-y divide-border">{recibos.map((r) => <tr key={r.id} className="hover:bg-muted/30"><td className="px-5"><p className="whitespace-nowrap font-mono font-medium text-primary">{formatRecibo(r.numeroRecibo)}</p><p className="mt-1.5 text-[11px] text-muted-foreground">{formatFecha(r.fechaPago)}</p></td><td className="max-w-64 break-words px-5"><p className="font-medium">{r.vivienda?.usuario?.nombreCompleto ?? "—"}</p><p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{formatDpi(r.vivienda?.usuario?.dpi ?? "")}</p></td><td className="px-5"><span className="inline-flex rounded-lg bg-primary/5 px-2 py-1 text-[11px] text-primary">{r.tipoCobro === "tarifa_anual" ? "Tarifa anual" : "Compra de chorro"}</span></td><td className="whitespace-nowrap px-5 text-right font-semibold tabular-nums">{formatQuetzales(r.totalPagado)}</td><td className="px-5 text-right"><Button variant="ghost" size="sm" onClick={() => onOpen(r)}>Ver PDF<ArrowUpRight className="size-3.5" /></Button></td></tr>)}</tbody></table></div>
  </>;
}
