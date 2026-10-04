"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, downloadBase64Pdf } from "@/lib/api";
import type { Recibo, UsuarioComunidad, Vivienda } from "@/lib/types";
import { numeroALetras } from "@/lib/numero-a-letras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/components/layout/page-header";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { formatDpi, formatFecha, formatQuetzales, formatRecibo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Pendientes {
  tarifaAnual: number;
  totalChorros: number;
  aniosPendientes: number[];
  detalle: { anio: number; monto: number }[];
  chorrosPendientesCompra?: {
    id: string;
    cantidad: number;
    precioCompra: string;
    activo: boolean;
  }[];
  vivienda: Vivienda & {
    usuario?: UsuarioComunidad;
    chorros?: {
      id: string;
      cantidad: number;
      precioCompra: string;
      activo: boolean;
    }[];
  };
}

type TipoCobro = "tarifa" | "compra";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function EmitirFacturaForm() {
  const anioActual = new Date().getFullYear();

  const [usuarios, setUsuarios] = useState<UsuarioComunidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [usuario, setUsuario] = useState<UsuarioComunidad | null>(null);
  const [viviendaId, setViviendaId] = useState("");
  const [pendientes, setPendientes] = useState<Pendientes | null>(null);
  const [tipo, setTipo] = useState<TipoCobro>("tarifa");
  const [anioCancelar, setAnioCancelar] = useState(String(anioActual));
  const [chorroCompraId, setChorroCompraId] = useState("");
  const [fechaPago, setFechaPago] = useState(todayIso());
  const [numeroRecibo, setNumeroRecibo] = useState("—");
  const [loading, setLoading] = useState(false);
  const [recientes, setRecientes] = useState<Recibo[]>([]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const activos = usuarios.filter((u) => u.activo);
    if (!q) return activos;
    return activos.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.dpi.includes(q.replace(/\D/g, "")),
    );
  }, [usuarios, busqueda]);

  async function cargarSiguienteYRecientes() {
    const [siguiente, lista] = await Promise.allSettled([
      api<{ numeroRecibo: string; anioRecibo: number }>(
        "/api/facturacion/siguiente-recibo",
      ),
      api<Recibo[]>("/api/facturacion/recibos?limit=6"),
    ]);
    if (siguiente.status === "fulfilled") {
      setNumeroRecibo(
        `${siguiente.value.anioRecibo}-${siguiente.value.numeroRecibo}`,
      );
    }
    if (lista.status === "fulfilled") setRecientes(lista.value);
  }

  useEffect(() => {
    api<UsuarioComunidad[]>("/api/usuarios")
      .then(setUsuarios)
      .catch(() => toast.error("No se pudieron cargar beneficiarios"));
    cargarSiguienteYRecientes().catch(() => undefined);
  }, []);

  async function cargarPendientes(id: string) {
    const data = await api<Pendientes>(`/api/facturacion/pendientes/${id}`);
    setPendientes(data);
    const ordenados = [...data.aniosPendientes].sort((a, b) => a - b);
    setAnioCancelar(String(ordenados[0] ?? anioActual));
    const chorros =
      data.chorrosPendientesCompra ??
      (data.vivienda.chorros ?? []).filter(
        (c) => c.activo && Number(c.precioCompra) > 0,
      );
    setChorroCompraId(chorros[0]?.id ?? "");
  }

  async function onSelectUsuario(id: string) {
    setUsuarioId(id);
    if (!id) {
      setUsuario(null);
      setViviendaId("");
      setPendientes(null);
      setChorroCompraId("");
      return;
    }
    try {
      const u =
        usuarios.find((x) => x.id === id) ??
        (await api<UsuarioComunidad>(`/api/usuarios/${id}`));
      setUsuario(u);
      const primera = u.viviendas?.find((v) => v.activa) ?? u.viviendas?.[0];
      if (primera) {
        setViviendaId(primera.id);
        await cargarPendientes(primera.id);
      } else {
        setViviendaId("");
        setPendientes(null);
        toast.error("Este beneficiario no tiene vivienda registrada");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error");
    }
  }

  const vivienda = useMemo(() => {
    return (usuario?.viviendas ?? []).find((v) => v.id === viviendaId) ?? null;
  }, [usuario, viviendaId]);

  const cantidadChorros = pendientes?.totalChorros ?? 0;
  const tarifaAnual = pendientes?.tarifaAnual ?? 0;

  const aniosPendientesOrdenados = useMemo(
    () => [...(pendientes?.aniosPendientes ?? [])].sort((a, b) => a - b),
    [pendientes],
  );

  const anioNum = Number(anioCancelar);
  const aniosAPagar = useMemo(() => {
    if (!Number.isInteger(anioNum)) return [] as number[];
    return aniosPendientesOrdenados.filter((a) => a <= anioNum);
  }, [aniosPendientesOrdenados, anioNum]);

  const chorrosCompra = useMemo(() => {
    if (pendientes?.chorrosPendientesCompra) {
      return pendientes.chorrosPendientesCompra;
    }
    return (pendientes?.vivienda.chorros ?? []).filter(
      (c) => c.activo && Number(c.precioCompra) > 0,
    );
  }, [pendientes]);

  const chorroSeleccionado = chorrosCompra.find((c) => c.id === chorroCompraId);

  const totalTarifa = useMemo(() => {
    if (!pendientes) return 0;
    return aniosAPagar.reduce((s, a) => {
      const d = pendientes.detalle.find((x) => x.anio === a);
      return s + (d?.monto ?? tarifaAnual * cantidadChorros);
    }, 0);
  }, [pendientes, aniosAPagar, tarifaAnual, cantidadChorros]);

  const totalCompra = Number(chorroSeleccionado?.precioCompra ?? 0);
  const total = tipo === "tarifa" ? totalTarifa : totalCompra;
  const letras = total > 0 ? numeroALetras(total) : "";

  const anioError =
    tipo === "tarifa" && usuarioId
      ? !Number.isInteger(anioNum)
        ? "Ingrese un año válido."
        : anioNum < 2000 || anioNum > anioActual
          ? `El año debe estar entre 2000 y ${anioActual}.`
          : aniosPendientesOrdenados.length === 0
            ? "No hay tarifa anual pendiente."
            : aniosAPagar.length === 0
              ? `No hay deuda hasta ${anioNum}. Pendiente: ${aniosPendientesOrdenados.join(", ")}.`
              : null
      : null;

  const canSubmit =
    Boolean(viviendaId) &&
    total > 0 &&
    !loading &&
    (tipo === "tarifa" ? !anioError && aniosAPagar.length > 0 : Boolean(chorroCompraId));

  async function guardar() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const descripcion =
        tipo === "tarifa"
          ? aniosAPagar.length === 1
            ? `Pago tarifa anual ${aniosAPagar[0]} — ${cantidadChorros} chorro(s)`
            : `Pago tarifa anual ${Math.min(...aniosAPagar)} a ${Math.max(...aniosAPagar)} — ${cantidadChorros} chorro(s)`
          : `Compra de chorro — ${chorroSeleccionado?.cantidad ?? 0} unidad(es)`;

      const path =
        tipo === "tarifa"
          ? "/api/facturacion/cobrar/tarifa-anual"
          : "/api/facturacion/cobrar/compra-chorro";

      const body =
        tipo === "tarifa"
          ? {
              viviendaId,
              anios: aniosAPagar,
              fechaPago,
              descripcionPago: descripcion,
            }
          : {
              viviendaId,
              chorroId: chorroCompraId,
              fechaPago,
              descripcionPago: descripcion,
            };

      const data = await api<{
        recibo: { numeroRecibo: string };
        pdf: {
          downloadBase64?: string;
          nombreArchivo: string;
          urlPublica?: string;
        };
      }>(path, { method: "POST", body: JSON.stringify(body) });

      toast.success(`Recibo ${data.recibo.numeroRecibo} emitido`);
      if (data.pdf.downloadBase64) {
        downloadBase64Pdf(data.pdf.downloadBase64, data.pdf.nombreArchivo);
      } else if (data.pdf.urlPublica) {
        window.open(data.pdf.urlPublica, "_blank");
      }

      setUsuarioId("");
      setUsuario(null);
      setViviendaId("");
      setPendientes(null);
      setBusqueda("");
      setFechaPago(todayIso());
      await cargarSiguienteYRecientes();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageStack>
      <PageIntro
        title="Emitir"
        action={
          <p className="text-right">
            <span className="block text-caption text-muted-foreground">
              Siguiente
            </span>
            <span className="font-mono text-[1.75rem] font-medium tabular-nums leading-none text-primary">
              {formatRecibo(numeroRecibo === "—" ? "" : numeroRecibo)}
            </span>
          </p>
        }
      />

      <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="buscar">Beneficiario</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="buscar"
                  className="h-10 rounded-full pl-10"
                  placeholder="Nombre o DPI"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <select
                className={cn(nativeSelectClass, "mt-2 h-10")}
                value={usuarioId}
                onChange={(e) => onSelectUsuario(e.target.value)}
              >
                <option value="">Beneficiario</option>
                {usuariosFiltrados.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombreCompleto} — {formatDpi(u.dpi)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                className="h-10"
                value={usuario?.nombreCompleto ?? ""}
                readOnly
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label>DPI</Label>
              <Input
                className="h-10 font-mono"
                value={usuario ? formatDpi(usuario.dpi, "") : ""}
                readOnly
                placeholder="—"
              />
            </div>

            {(usuario?.viviendas?.length ?? 0) > 1 ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dirección / vivienda</Label>
                <select
                  className={cn(nativeSelectClass, "h-10")}
                  value={viviendaId}
                  onChange={async (e) => {
                    setViviendaId(e.target.value);
                    await cargarPendientes(e.target.value);
                  }}
                >
                  {(usuario?.viviendas ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.direccion}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dirección</Label>
                <Input
                  className="h-10"
                  value={vivienda?.direccion ?? ""}
                  readOnly
                  placeholder="—"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Cantidad de chorros</Label>
              <Input
                className="h-10 tabular-nums"
                value={usuario ? String(cantidadChorros) : ""}
                readOnly
                placeholder="—"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de pago</Label>
            <div
              className="flex flex-wrap gap-x-8 gap-y-1"
              role="radiogroup"
              aria-label="Tipo de pago"
            >
              <TipoPagoCard
                selected={tipo === "tarifa"}
                title="Tarifa anual"
                onSelect={() => setTipo("tarifa")}
              />
              <TipoPagoCard
                selected={tipo === "compra"}
                title="Compra de chorro"
                onSelect={() => setTipo("compra")}
              />
            </div>
          </div>

          {tipo === "tarifa" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="anio">Año a cancelar</Label>
                <Input
                  id="anio"
                  className="h-10 tabular-nums"
                  inputMode="numeric"
                  placeholder={String(anioActual)}
                  value={anioCancelar}
                  onChange={(e) =>
                    setAnioCancelar(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  disabled={!usuarioId}
                />
                {anioError ? (
                  <p className="text-caption text-destructive">{anioError}</p>
                ) : aniosAPagar.length > 0 ? (
                  <p className="text-caption text-muted-foreground">
                    Se cobrará{" "}
                    {aniosAPagar.length === 1
                      ? `el año ${aniosAPagar[0]}`
                      : `${Math.min(...aniosAPagar)} a ${Math.max(...aniosAPagar)}`}
                    {tarifaAnual
                      ? ` · ${formatQuetzales(tarifaAnual)} × ${cantidadChorros} chorro(s) × ${aniosAPagar.length} año(s)`
                      : ""}
                  </p>
                ) : aniosPendientesOrdenados.length > 0 ? (
                  <p className="text-caption text-muted-foreground">
                    Pendiente: {aniosPendientesOrdenados.join(", ")}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha de pago</Label>
                <Input
                  id="fecha"
                  className="h-10"
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Chorro a cobrar</Label>
                {chorrosCompra.length === 0 ? (
                  <p className="py-2.5 text-sm text-muted-foreground">
                    {usuarioId ? "Sin compra pendiente." : "Elija un beneficiario."}
                  </p>
                ) : (
                  <select
                    className={cn(nativeSelectClass, "h-10")}
                    value={chorroCompraId}
                    onChange={(e) => setChorroCompraId(e.target.value)}
                  >
                    {chorrosCompra.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cantidad} unidad(es): {formatQuetzales(c.precioCompra)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha-compra">Fecha de pago</Label>
                <Input
                  id="fecha-compra"
                  className="h-10"
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Total a pagar</Label>
              <p className="flex h-12 items-center font-mono text-xl tabular-nums">
                {formatQuetzales(total)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad en letras</Label>
              <Input className="h-12" value={letras || "—"} readOnly />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="h-11 min-w-44 rounded-full md:h-10"
              disabled={!canSubmit}
              onClick={guardar}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <Receipt className="size-4" />
                  Emitir
                </>
              )}
            </Button>
          </div>
      </div>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2>Últimos recibos</h2>
          <Link
            href="/historial"
            className="text-caption text-primary transition-ui hover:underline"
          >
            Historial
          </Link>
        </div>
        {recientes.length === 0 ? (
          <p className="mt-3 text-caption text-muted-foreground">Sin recibos.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-130 text-left text-base">
              <thead className="border-b border-border text-sm text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Recibo</th>
                  <th className="py-3 pr-4 font-medium">Beneficiario</th>
                  <th className="py-3 pr-4 font-medium">Fecha</th>
                  <th className="py-3 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recientes.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-mono tabular-nums text-primary">
                      {formatRecibo(r.numeroRecibo)}
                    </td>
                    <td className="max-w-55 truncate py-3 pr-4">
                      {r.vivienda?.usuario?.nombreCompleto ?? "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-muted-foreground">
                      {formatFecha(r.fechaPago)}
                    </td>
                    <td className="py-3 font-mono tabular-nums">
                      {formatQuetzales(r.totalPagado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageStack>
  );
}

function TipoPagoCard({
  selected,
  title,
  onSelect,
}: {
  selected: boolean;
  title: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "min-h-10 rounded-full border px-4 py-2.5 text-left text-sm font-medium transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {title}
    </button>
  );
}
