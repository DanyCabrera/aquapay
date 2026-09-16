export type Rol = "administrador" | "tesorero";

export interface UsuarioSistema {
  id: string;
  nombre: string;
  dpi: string;
  rol: Rol;
}

export interface Chorro {
  id: string;
  viviendaId: string;
  precioCompra: string;
  cantidad: number;
  activo: boolean;
  fechaInstalacion: string;
}

export interface Vivienda {
  id: string;
  usuarioId: string;
  direccion: string;
  activa: boolean;
  anioInicioCobro: number;
  chorros?: Chorro[];
}

export interface UsuarioComunidad {
  id: string;
  nombreCompleto: string;
  dpi: string;
  telefono: string | null;
  activo: boolean;
  fechaRegistro: string;
  viviendas?: Vivienda[];
}

export interface Recibo {
  id: string;
  numeroRecibo: string;
  tipoCobro: "tarifa_anual" | "compra_chorro";
  totalPagado: string;
  cantidadEnLetras: string;
  descripcionPago: string;
  lugarPago: string;
  fechaPago: string;
  tesorero?: UsuarioSistema;
  pdf?: {
    urlPublica?: string | null;
    nombreArchivo: string;
  } | null;
  vivienda?: Vivienda & { usuario?: UsuarioComunidad };
}

export interface DashboardData {
  totalUsuarios: number;
  totalViviendas: number;
  totalChorros?: number;
  facturasMes: number;
  ingresosMes: number;
  ingresosPorMes: { mes: number; total: number }[];
  tarifaAnual: number;
}
