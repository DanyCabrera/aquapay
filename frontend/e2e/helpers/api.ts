import { API_URL, ADMIN, TESORERO, dpiUnico } from "./cuentas";

type LoginData = {
  accessToken: string;
  usuario: { id: string; nombre: string; rol: string };
};

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as {
    message?: string;
    data?: T;
  };
  if (!res.ok) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return (json.data ?? json) as T;
}

export async function loginORestablecer(dpi: string, password: string) {
  const intentar = () =>
    fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dpi, password }),
    });

  let res = await intentar();
  if (!res.ok) {
    const reset = await fetch(`${API_URL}/api/auth/restablecer-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dpi, password }),
    });
    if (!reset.ok) {
      const body = await reset.text();
      throw new Error(`No se pudo restablecer ${dpi}: ${body}`);
    }
    res = await intentar();
  }

  return parse<LoginData>(res);
}

export async function tokenAdmin() {
  const data = await loginORestablecer(ADMIN.dpi, ADMIN.password);
  return data.accessToken;
}

export async function tokenTesorero() {
  const data = await loginORestablecer(TESORERO.dpi, TESORERO.password);
  return data.accessToken;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export type BeneficiarioDeuda = {
  usuarioId: string;
  nombre: string;
  dpi: string;
  viviendaId: string;
  anio: number;
};

export async function sembrarBeneficiarioConDeuda(): Promise<BeneficiarioDeuda> {
  const token = await tokenAdmin();
  const anio = new Date().getFullYear();
  const dpi = dpiUnico();
  const nombre = `E2E Tesorero ${dpi.slice(-4)}`;

  const usuario = await parse<{ id: string }>(
    await fetch(`${API_URL}/api/usuarios`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        nombreCompleto: nombre,
        dpi,
        telefono: "55550000",
      }),
    }),
  );

  const vivienda = await parse<{ id: string }>(
    await fetch(`${API_URL}/api/usuarios/${usuario.id}/viviendas`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        direccion: `Calle E2E ${dpi.slice(-4)}, Aldea Sibaná`,
        anioInicioCobro: anio,
      }),
    }),
  );

  await parse(
    await fetch(`${API_URL}/api/usuarios/viviendas/${vivienda.id}/chorros`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        cantidad: 1,
        precioCompra: 1500,
      }),
    }),
  );

  return { usuarioId: usuario.id, nombre, dpi, viviendaId: vivienda.id, anio };
}

export async function desactivarBeneficiario(usuarioId: string) {
  const token = await tokenAdmin();
  const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/desactivar`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`No se pudo desactivar ${usuarioId}`);
  }
}

export async function cobrarTarifa(deuda: BeneficiarioDeuda) {
  const token = await tokenTesorero();
  return parse<{
    recibo: { id: string; numeroRecibo: string };
    pdf: { nombreArchivo: string };
  }>(
    await fetch(`${API_URL}/api/facturacion/cobrar/tarifa-anual`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        viviendaId: deuda.viviendaId,
        anios: [deuda.anio],
        fechaPago: new Date().toISOString().slice(0, 10),
        descripcionPago: `E2E tarifa ${deuda.nombre}`,
      }),
    }),
  );
}
