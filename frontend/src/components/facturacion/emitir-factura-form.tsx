"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, downloadBase64Pdf } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Recibo, UsuarioComunidad, Vivienda } from "@/lib/types";
import { numeroALetras } from "@/lib/numero-a-letras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Surface, nativeSelectClass } from "@/components/layout/page-header";
import { PageStack, PageIntro } from "@/components/layout/page-stack";
import { formatFecha, formatQuetzales } from "@/lib/format";
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
  const { user } = useAuth();
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
        title="Emitir recibo"
        description="Elija el beneficiario y el cobro. El total y el número se calculan solos."
        action={
          <p className="text-right">
            <span className="block text-sm text-muted-foreground">
              Siguiente recibo
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-primary">
              {numeroRecibo}
            </span>
          </p>
        }
      />

      <Surface className="p-5 sm:p-6">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="buscar">Beneficiario</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="buscar"
                  className="h-10 pl-9"
                  placeholder="Buscar por nombre o DPI…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <select
                className={cn(nativeSelectClass, "mt-2 h-10")}
                value={usuarioId}
                onChange={(e) => onSelectUsuario(e.target.value)}
              >
                <option value="">Seleccione un beneficiario…</option>
                {usuariosFiltrados.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombreCompleto} — DPI {u.dpi}
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
                placeholder="Se llena al elegir el usuario"
              />
            </div>
            <div className="space-y-1.5">
              <Label>DPI</Label>
              <Input
                className="h-10 font-mono"
                value={usuario?.dpi ?? ""}
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
                  placeholder="Se llena al elegir el usuario"
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
            <div className="space-y-1.5">
              <Label>No. de recibo</Label>
              <Input
                className="h-10 font-mono"
                value={numeroRecibo}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de pago</Label>
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Tipo de pago"
            >
              <TipoPagoCard
                selected={tipo === "tarifa"}
                title="Tarifa anual"
                description="Servicio por año, por chorro"
                onSelect={() => setTipo("tarifa")}
              />
              <TipoPagoCard
                selected={tipo === "compra"}
                title="Compra de chorro"
                description="Cobro único de instalación"
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
                  <p className="text-xs text-destructive">{anioError}</p>
                ) : aniosAPagar.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Se cobrará{" "}
                    {aniosAPagar.length === 1
                      ? `el año ${aniosAPagar[0]}`
                      : `${Math.min(...aniosAPagar)} a ${Math.max(...aniosAPagar)}`}
                    {tarifaAnual
                      ? ` · ${formatQuetzales(tarifaAnual)} × ${cantidadChorros} chorro(s) × ${aniosAPagar.length} año(s)`
                      : ""}
                  </p>
                ) : aniosPendientesOrdenados.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Años pendientes: {aniosPendientesOrdenados.join(", ")}
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
                  <p className="rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                    {usuarioId
                      ? "No hay compra de chorro pendiente."
                      : "Seleccione un beneficiario."}
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
              <div className="flex h-12 items-center border border-border bg-muted px-4 font-mono text-xl font-semibold tabular-nums text-primary">
                {formatQuetzales(total)}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad en letras</Label>
              <Input className="h-12" value={letras || "—"} readOnly />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Emite: {user?.nombre ?? "Tesorero"}
            </p>
            <Button
              className="h-10 min-w-44"
              disabled={!canSubmit}
              onClick={guardar}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generando…
                </>
              ) : (
                "Emitir recibo"
              )}
            </Button>
          </div>
        </div>
      </Surface>

      <section>
        <h2>Últimos recibos</h2>
        {recientes.length === 0 ? (
          <p className="mt-3 max-w-prose text-base text-muted-foreground">
            Aquí aparecen los recibos que emita hoy. El primero lleva el número
            de arriba.
          </p>
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
                      {r.numeroRecibo}
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
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "rounded-md border px-4 py-3 text-left transition-ui focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/30",
        selected
          ? "border-primary bg-muted text-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
