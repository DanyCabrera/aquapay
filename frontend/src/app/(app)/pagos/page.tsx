"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Recibo, UsuarioComunidad } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Surface } from "@/components/layout/page-header";
import { formatFecha, formatQuetzales } from "@/lib/format";

export default function PagosPage() {
  const [dpi, setDpi] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [usuario, setUsuario] = useState<UsuarioComunidad | null>(null);
  const [recibos, setRecibos] = useState<Recibo[]>([]);

  async function buscar(e: FormEvent) {
    e.preventDefault();
    try {
      const u = await api<UsuarioComunidad>(`/api/usuarios/dpi/${dpi}`);
      setUsuario(u);
      const hist = await api<Recibo[]>(
        `/api/facturacion/historial/${u.id}?anio=${anio}`,
      );
      setRecibos(hist);
    } catch (err) {
      setUsuario(null);
      setRecibos([]);
      toast.error(err instanceof ApiError ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Historial de pagos"
        description="Busque por DPI y año para ver los recibos de un beneficiario."
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Pagos" },
        ]}
      />

      <Surface className="p-4 sm:p-5">
        <form
          onSubmit={buscar}
          className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="DPI…"
              value={dpi}
              onChange={(e) => setDpi(e.target.value.replace(/\D/g, ""))}
              required
              aria-label="DPI"
            />
          </div>
          <Input
            className="h-10"
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            placeholder="Año"
            aria-label="Año"
          />
          <Button type="submit" className="h-10">
            Consultar
          </Button>
        </form>
      </Surface>

      {!usuario ? (
        <EmptyState
          title="Aún no hay consulta"
          description="Escriba el DPI del beneficiario y el año. Luego pulse Consultar."
        />
      ) : recibos.length === 0 ? (
        <EmptyState
          title={`Sin pagos en ${anio}`}
          description={`${usuario.nombreCompleto} no tiene recibos en ese período.`}
        />
      ) : (
        <Surface className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{usuario.nombreCompleto}</p>
            <p className="font-mono text-caption text-muted-foreground">
              DPI {usuario.dpi}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Recibo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tesorero</TableHead>
                  <TableHead>PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recibos.map((r) => (
                  <TableRow key={r.id} className="transition-ui">
                    <TableCell className="font-mono text-caption text-muted-foreground">
                      {r.numeroRecibo}
                    </TableCell>
                    <TableCell className="font-mono text-caption text-muted-foreground">
                      {formatFecha(r.fechaPago)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="pagado">
                        {r.tipoCobro === "tarifa_anual"
                          ? "Tarifa anual"
                          : "Compra chorro"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {formatQuetzales(r.totalPagado)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.tesorero?.nombre ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.pdf?.urlPublica ? (
                        <a
                          href={r.pdf.urlPublica}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary transition-ui hover:underline"
                        >
                          Abrir
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Surface>
      )}
    </div>
  );
}
