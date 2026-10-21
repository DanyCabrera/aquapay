"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, House, Loader2, Receipt, Search, ShieldCheck } from "lucide-react";
import { ReceiptList } from "@/components/tesorero/receipt-list";
import { EliminarReciboDialog } from "@/components/facturacion/eliminar-recibo-dialog";
import { FixedPaymentSummary } from "./fixed-payment-summary";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Recibo, UsuarioComunidad, Vivienda } from "@/lib/types";
import {
  ReciboPdfViewer,
  sourceFromRecibo,
  type ReciboPdfSource,
} from "@/components/facturacion/recibo-pdf-viewer";
import { numeroALetras } from "@/lib/numero-a-letras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
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
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
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
  const [descripcionPago, setDescripcionPago] = useState("");
  const [numeroRecibo, setNumeroRecibo] = useState("—");
  const [loading, setLoading] = useState(false);
  const [recientes, setRecientes] = useState<Recibo[]>([]);
  const [pdfSource, setPdfSource] = useState<ReciboPdfSource | null>(null);
  const [reciboEliminar, setReciboEliminar] = useState<Recibo | null>(null);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingPendientes, setLoadingPendientes] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState("");
  const [errorPendientes, setErrorPendientes] = useState("");
  const [errorRecientes, setErrorRecientes] = useState(false);
  const [loadingRecientes, setLoadingRecientes] = useState(true);
  const seleccion = useRef(0);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const activos = usuarios.filter((u) => u.activo);
    if (!q) return activos;
    return activos.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(q) ||
        (/^[\d\s-]+$/.test(q) && u.dpi.includes(q.replace(/\D/g, ""))),
    );
  }, [usuarios, busqueda]);

  async function cargarSiguienteYRecientes() {
    setLoadingRecientes(true);
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
    } else setNumeroRecibo("—");
    if (lista.status === "fulfilled") setRecientes(lista.value);
    setErrorRecientes(lista.status === "rejected");
    setLoadingRecientes(false);
  }

  async function cargarUsuarios() {
    setLoadingUsuarios(true); setErrorUsuarios("");
    try { setUsuarios(await api<UsuarioComunidad[]>("/api/usuarios")); }
    catch { setErrorUsuarios("No se pudieron cargar los beneficiarios. Revisa la conexión e inténtalo de nuevo."); }
    finally { setLoadingUsuarios(false); }
  }
  useEffect(() => { void cargarUsuarios(); void cargarSiguienteYRecientes(); }, []);

  async function cargarPendientes(id: string) {
    const request = ++seleccion.current;
    setPendientes(null); setLoadingPendientes(true); setErrorPendientes("");
    try {
    const data = await api<Pendientes>(`/api/facturacion/pendientes/${id}`);
    if (request !== seleccion.current) return;
    setPendientes(data);
    const ordenados = [...data.aniosPendientes].sort((a, b) => a - b);
    setAnioCancelar(String(ordenados[0] ?? anioActual));
    const chorros =
      data.chorrosPendientesCompra ??
      (data.vivienda.chorros ?? []).filter(
        (c) => c.activo && Number(c.precioCompra) > 0,
      );
    setChorroCompraId(chorros[0]?.id ?? "");
    } catch (e) {
      if (request === seleccion.current) setErrorPendientes(e instanceof Error ? e.message : "No se pudo consultar la deuda.");
    } finally { if (request === seleccion.current) setLoadingPendientes(false); }
  }

  async function onSelectUsuario(id: string) {
    setUsuarioId(id);
    seleccion.current++;
    setPendientes(null); setUsuario(null); setViviendaId(""); setChorroCompraId(""); setErrorPendientes(""); setLoadingPendientes(false);
    if (!id) {
      setUsuario(null);
      setViviendaId("");
      setPendientes(null);
      setChorroCompraId("");
      return;
    }
    try {
      const u = usuarios.find((x) => x.id === id);
      if (!u) return;
      setUsuario(u);
      const primera = u.viviendas?.find((v) => v.activa);
      if (primera) {
        setViviendaId(primera.id);
        await cargarPendientes(primera.id);
      } else {
        setViviendaId("");
        setPendientes(null);
        setErrorPendientes("Este beneficiario no tiene una vivienda activa. Solicita al administrador que revise su registro.");
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
    tipo === "tarifa" && pendientes
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
    !loadingPendientes && Boolean(fechaPago) && Boolean(pendientes) &&
    (tipo === "tarifa" ? !anioError && aniosAPagar.length > 0 : Boolean(chorroCompraId));

  async function guardar() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const descripcionAutomatica =
        tipo === "tarifa"
          ? aniosAPagar.length === 1
            ? `Pago tarifa anual ${aniosAPagar[0]} — ${cantidadChorros} chorro(s)`
            : `Pago tarifa anual ${Math.min(...aniosAPagar)} a ${Math.max(...aniosAPagar)} — ${cantidadChorros} chorro(s)`
          : `Compra de chorro — ${chorroSeleccionado?.cantidad ?? 0} unidad(es)`;
      const descripcion = descripcionPago.trim() || descripcionAutomatica;

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
        recibo: { id: string; numeroRecibo: string };
        pdf: {
          downloadBase64?: string;
          nombreArchivo: string;
        };
      }>(path, { method: "POST", body: JSON.stringify(body) });

      toast.success(`Recibo ${data.recibo.numeroRecibo} emitido`);
      setPdfSource(
        sourceFromRecibo(data.recibo, {
          nombreArchivo: data.pdf.nombreArchivo,
          base64: data.pdf.downloadBase64,
        }),
      );

      setTipo("tarifa");
      setAnioCancelar(String(anioActual));
      setChorroCompraId("");
      setUsuarioId("");
      setUsuario(null);
      setViviendaId("");
      setPendientes(null);
      setBusqueda("");
      setFechaPago(todayIso());
      setDescripcionPago("");
      await cargarSiguienteYRecientes();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageStack className="emision-workspace min-w-0 gap-5 sm:gap-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Emitir recibo</h2>
          <p data-testid="recibo-correlativo" className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:w-auto sm:flex-col sm:items-end sm:gap-0 sm:border-0 sm:p-0 xl:fixed xl:right-15 xl:top-25">
            <span className="block text-caption text-muted-foreground">
              Correlativo
            </span>
            <span className="font-mono text-xl font-medium tabular-nums leading-none text-primary sm:text-[1.75rem]">
              {formatRecibo(numeroRecibo === "—" ? "" : numeroRecibo)}
            </span>
          </p>
      </div>

      <fieldset disabled={loading} className="contents"><div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <div className="space-y-5 min-w-0">
      <section className="admin-surface overflow-hidden">
        <div className="admin-surface-header"><div><p className="admin-kicker mb-1">Paso 01</p><h2>Beneficiario y vivienda</h2></div><House className="size-5 text-primary" /></div>
      <div className="emision-section-body space-y-6 p-5 sm:p-6">
          {errorUsuarios && <div role="alert" className="space-y-3 text-sm text-destructive"><p>{errorUsuarios}</p><Button variant="outline" onClick={() => void cargarUsuarios()}>Reintentar</Button></div>}
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
                  onChange={(e) => { setBusqueda(e.target.value); if (usuarioId) void onSelectUsuario(""); }}
                />
              </div>
              <select
                aria-label="Beneficiario"
                className={cn(nativeSelectClass, "mt-2 h-10")}
                value={usuarioId}
                disabled={loadingUsuarios || loading}
                onChange={(e) => onSelectUsuario(e.target.value)}
              >
                <option value="">{loadingUsuarios ? "Cargando beneficiarios…" : "Seleccionar beneficiario"}</option>
                {usuariosFiltrados.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombreCompleto} — {formatDpi(u.dpi)}
                  </option>
                ))}
              </select>
              {!loadingUsuarios && !errorUsuarios && busqueda.trim() && <p className="text-xs text-muted-foreground" aria-live="polite">{`${usuariosFiltrados.length} ${usuariosFiltrados.length === 1 ? "beneficiario activo encontrado" : "beneficiarios activos encontrados"} para «${busqueda.trim()}».`}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beneficiario-nombre">Nombre</Label>
              <Input
                id="beneficiario-nombre"
                className="h-10"
                value={usuario?.nombreCompleto ?? ""}
                readOnly
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="beneficiario-dpi">DPI</Label>
              <Input
                id="beneficiario-dpi"
                className="h-10 font-mono"
                value={usuario ? formatDpi(usuario.dpi, "") : ""}
                readOnly
                placeholder="—"
              />
            </div>

            {(usuario?.viviendas?.length ?? 0) > 1 ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vivienda-select">Dirección / vivienda</Label>
                <select
                  id="vivienda-select"
                  className={cn(nativeSelectClass, "h-10")}
                  value={viviendaId}
                  aria-label="Dirección / vivienda"
                  onChange={async (e) => {
                    setViviendaId(e.target.value);
                    await cargarPendientes(e.target.value);
                  }}
                >
                  {(usuario?.viviendas ?? []).filter((v) => v.activa).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.direccion}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vivienda-direccion">Dirección</Label>
                <Input
                  id="vivienda-direccion"
                  className="h-10"
                  value={vivienda?.direccion ?? ""}
                  readOnly
                  placeholder="—"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cantidad-chorros">Cantidad de chorros</Label>
              <Input
                id="cantidad-chorros"
                className="h-10 tabular-nums"
                value={usuario ? String(cantidadChorros) : ""}
                readOnly
                placeholder="—"
              />
            </div>
          </div>

          {loadingPendientes && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Consultando pendientes…</p>}
          {errorPendientes && <div role="alert" className="space-y-3 rounded-xl bg-destructive/5 p-4 text-sm text-destructive"><p>{errorPendientes}</p>{viviendaId && <Button variant="outline" onClick={() => void cargarPendientes(viviendaId)}>Reintentar consulta</Button>}</div>}
      </div></section>
      <section className="admin-surface overflow-hidden"><div className="admin-surface-header"><div><p className="admin-kicker mb-1">Paso 02</p><h2>Concepto y fecha de pago</h2></div><Receipt className="size-5 text-primary" /></div><div className="emision-section-body space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <Label>Tipo de pago</Label>
            <div
              className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap sm:gap-3"
              role="radiogroup"
              aria-label="Tipo de pago"
              onKeyDown={(e) => {
                if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
                e.preventDefault();
                const next = tipo === "tarifa" ? "compra" : "tarifa";
                setTipo(next);
                e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next === "tarifa" ? 0 : 1]?.focus();
              }}
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
                <Label htmlFor="chorro-compra">Chorro a cobrar</Label>
                {chorrosCompra.length === 0 ? (
                  <p className="py-2.5 text-sm text-muted-foreground">
                    {usuarioId ? "Sin compra pendiente." : "Elija un beneficiario."}
                  </p>
                ) : (
                  <select
                    id="chorro-compra"
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

          <div className="space-y-2">
            <Label htmlFor="descripcion-pago">Descripción <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <textarea id="descripcion-pago" rows={4} maxLength={500} value={descripcionPago} onChange={(e) => setDescripcionPago(e.target.value)} placeholder="Observación del pago" aria-describedby="descripcion-pago-ayuda" className="w-full min-w-0 resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none transition-ui placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50" />
            <div id="descripcion-pago-ayuda" className="flex items-start justify-between gap-3 text-[11px] leading-relaxed text-muted-foreground"><p className="min-w-0 flex-1">En el recibo; automática si se deja vacía.</p><span className="shrink-0 tabular-nums">{descripcionPago.length}/500</span></div>
          </div>
      </div></section>
      </div>
      <FixedPaymentSummary><div className="admin-surface-header"><div><p className="admin-kicker mb-1">Paso 03</p><h2>Resumen del cobro</h2></div><ShieldCheck className="size-5 text-primary" /></div><div className="emision-section-body space-y-5 p-5 sm:p-6">
          <dl className="space-y-4 text-xs"><div><dt className="text-muted-foreground">Beneficiario</dt><dd className="mt-1 break-words font-semibold">{usuario?.nombreCompleto || "Por seleccionar"}</dd></div><div><dt className="text-muted-foreground">Vivienda</dt><dd className="mt-1 break-words leading-relaxed">{vivienda?.direccion || "Por seleccionar"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Concepto</dt><dd>{tipo === "tarifa" ? "Tarifa anual" : "Compra de chorro"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Fecha</dt><dd>{formatFecha(fechaPago)}</dd></div>{tipo === "tarifa" && aniosAPagar.length > 0 && <div><dt className="text-muted-foreground">Años incluidos</dt><dd className="mt-1 break-words">{aniosAPagar.join(", ")}</dd></div>}</dl>
          <div className="grid gap-4 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label>Total a pagar</Label>
              <p className="flex h-12 items-center text-3xl font-semibold tracking-tight tabular-nums" aria-live="polite">
                {formatQuetzales(total)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad en letras</Label>
              <p className="text-xs leading-relaxed text-muted-foreground">{letras || "—"}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="h-12 w-full"
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
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />Emite solo si recibiste el pago. El número final se asigna al guardar.</p>
      </div></FixedPaymentSummary></div></fieldset>

      <section data-testid="recibos-recientes" className="admin-surface min-w-0 w-full xl:w-[62%]">
        <div className="admin-surface-header"><div><h2>Últimos recibos</h2></div><Link href="/historial" className="text-xs font-medium text-primary">Ver historial</Link></div>
        {loadingRecientes ? <p role="status" className="p-6 text-sm text-muted-foreground">Cargando recibos recientes…</p> : errorRecientes ? <div role="alert" className="space-y-3 p-6"><p className="text-sm text-muted-foreground">No se pudieron consultar los recibos recientes.</p><Button variant="outline" onClick={() => void cargarSiguienteYRecientes()}>Reintentar</Button></div> : recientes.length ? <ReceiptList recibos={recientes} onOpen={(r) => setPdfSource(sourceFromRecibo(r))} onDelete={setReciboEliminar} /> : <div className="p-6"><p className="text-sm font-medium">Sin recibos registrados</p></div>}
      </section>
      <EliminarReciboDialog recibo={reciboEliminar} onClose={() => setReciboEliminar(null)} onDeleted={() => {
        setPdfSource(null);
        void cargarSiguienteYRecientes();
      }} />
      <ReciboPdfViewer source={pdfSource} onClose={() => setPdfSource(null)} />
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
      tabIndex={selected ? 0 : -1}
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
