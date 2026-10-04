require("dotenv").config();
const { Client } = require("pg");
const { randomUUID } = require("crypto");

/**
 * 15 beneficiarios de prueba, cada uno con:
 * - vivienda y chorro
 * - factura de tarifa anual (año actual)
 * - factura de compra de chorro
 *
 * Idempotente por DPI (2487010000101 … 2487010000115).
 * Uso: node scripts/seed-15-usuarios-con-facturas.js
 */

const UNIDADES = [
  "", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiún", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function seccion(n) {
  if (n === 0) return "";
  if (n === 100) return "cien";
  if (n < 30) return UNIDADES[n];
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const d = Math.floor(resto / 10);
  const u = resto % 10;
  let texto = CENTENAS[c] ? `${CENTENAS[c]} ` : "";
  if (resto < 30) texto += UNIDADES[resto];
  else if (u === 0) texto += DECENAS[d];
  else texto += `${DECENAS[d]} y ${UNIDADES[u]}`;
  return texto.trim();
}

function miles(n) {
  if (n < 1000) return seccion(n);
  const m = Math.floor(n / 1000);
  const r = n % 1000;
  const prefijo = m === 1 ? "mil" : `${seccion(m)} mil`;
  return r === 0 ? prefijo : `${prefijo} ${seccion(r)}`;
}

function numeroALetras(monto) {
  const entero = Math.floor(Math.abs(monto));
  const centavos = Math.round((Math.abs(monto) - entero) * 100);
  let texto =
    entero === 0
      ? "cero quetzales"
      : entero === 1
        ? "un quetzal"
        : `${miles(entero)} quetzales`;
  texto += centavos > 0 ? ` con ${String(centavos).padStart(2, "0")}/100` : " exactos";
  return texto;
}

function isoDate(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const anio = new Date().getFullYear();

const SEEDS = [
  { nombre: "Pedro Antonio Gómez López", telefono: "5510-1101", direccion: "Calle Principal 4, Sector 1", cantidad: 1, compra: 350, mes: 9, dia: 3 },
  { nombre: "Lucía Fernanda Castillo Ruiz", telefono: "5510-1102", direccion: "Caserío El Llano, casa 9", cantidad: 1, compra: 400, mes: 9, dia: 5 },
  { nombre: "Miguel Ángel Soto Méndez", telefono: "5510-1103", direccion: "Cantón Centro, callejón 2", cantidad: 2, compra: 500, mes: 9, dia: 7 },
  { nombre: "Carmen Elena Vásquez Díaz", telefono: "5510-1104", direccion: "Zona alta, pasaje Las Flores", cantidad: 1, compra: 280, mes: 9, dia: 8 },
  { nombre: "Ricardo José Barrios Cruz", telefono: "5510-1105", direccion: "Orilla del río, vivienda 8", cantidad: 1, compra: 650, mes: 9, dia: 10 },
  { nombre: "Patricia Isabel Chávez Morales", telefono: "5510-1106", direccion: "Frente a la escuela, casa 3", cantidad: 2, compra: 720, mes: 9, dia: 12 },
  { nombre: "Héctor Manuel Aguilar Pérez", telefono: "5510-1107", direccion: "Caserío Los Cerritos 11", cantidad: 1, compra: 300, mes: 8, dia: 14 },
  { nombre: "Sandra Marisol López García", telefono: "5510-1108", direccion: "Sector 2, calle del mercado", cantidad: 1, compra: 450, mes: 8, dia: 18 },
  { nombre: "Óscar David Ramírez Santos", telefono: "5510-1109", direccion: "Cantón Abajo, casa 15", cantidad: 1, compra: 550, mes: 7, dia: 6 },
  { nombre: "Marta Alicia Hernández Soto", telefono: "5510-1110", direccion: "A un costado de la iglesia", cantidad: 2, compra: 800, mes: 7, dia: 21 },
  { nombre: "Francisco Javier Méndez Ruiz", telefono: "5510-1111", direccion: "Calle de la cancha, 6", cantidad: 1, compra: 375, mes: 6, dia: 4 },
  { nombre: "Gloria Esperanza Díaz López", telefono: "5510-1112", direccion: "Caserío El Palmar, casa 2", cantidad: 1, compra: 420, mes: 6, dia: 16 },
  { nombre: "Raúl Enrique Morales Castillo", telefono: "5510-1113", direccion: "Pasaje Los Pinos 8", cantidad: 1, compra: 900, mes: 4, dia: 9 },
  { nombre: "Teresa de Jesús Pérez Barrios", telefono: "5510-1114", direccion: "Zona baja, vivienda 12", cantidad: 2, compra: 1100, mes: 3, dia: 11 },
  { nombre: "Álvaro Estuardo Cruz Vásquez", telefono: "5510-1115", direccion: "Entrada de la aldea, casa 1", cantidad: 1, compra: 1500, mes: 1, dia: 20 },
].map((u, i) => ({
  ...u,
  id: randomUUID(),
  viviendaId: randomUUID(),
  chorroId: randomUUID(),
  dpi: `2487010000${String(101 + i)}`,
}));

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query("BEGIN");

    const tesorero = await client.query(
      `SELECT id FROM perfiles
       WHERE activo = TRUE
       ORDER BY CASE WHEN rol = 'tesorero' THEN 0 ELSE 1 END, fecha_creacion
       LIMIT 1`,
    );
    if (!tesorero.rowCount) {
      throw new Error("No hay un perfil (tesorero o admin) para emitir los recibos.");
    }
    const creadoPor = tesorero.rows[0].id;

    await client.query(
      `INSERT INTO configuracion (clave, valor)
       VALUES ('tarifa_anual', '120')
       ON CONFLICT (clave) DO NOTHING`,
    );
    await client.query(
      `INSERT INTO configuracion (clave, valor)
       VALUES ('lugar_pago', 'Aldea Sibaná, El Asintal, Retalhuleu')
       ON CONFLICT (clave) DO NOTHING`,
    );

    const tarifaRow = await client.query(
      `SELECT valor FROM configuracion WHERE clave = 'tarifa_anual'`,
    );
    const tarifa = Number(tarifaRow.rows[0]?.valor ?? 120);
    const lugarPago = "Aldea Sibaná, El Asintal, Retalhuleu";

    const seqRow = await client.query(
      `SELECT COALESCE(MAX(secuencia), 0)::int AS max
       FROM recibos WHERE anio_recibo = $1`,
      [anio],
    );
    let secuencia = seqRow.rows[0].max;

    const chorroCols = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'chorros'`,
    );
    const hasCuota = chorroCols.rows.some((r) => r.column_name === "cuota_mensual");

    let creados = 0;
    let omitidos = 0;
    let facturas = 0;

    for (const u of SEEDS) {
      const exists = await client.query(
        `SELECT id FROM usuarios_comunidad WHERE dpi = $1`,
        [u.dpi],
      );
      if (exists.rowCount > 0) {
        omitidos += 1;
        continue;
      }

      await client.query(
        `INSERT INTO usuarios_comunidad (id, nombre_completo, dpi, telefono, activo)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [u.id, u.nombre, u.dpi, u.telefono],
      );

      await client.query(
        `INSERT INTO viviendas (id, usuario_id, direccion, activa, anio_inicio_cobro)
         VALUES ($1, $2, $3, TRUE, $4)`,
        [u.viviendaId, u.id, `${u.direccion}, Aldea Sibaná`, anio],
      );

      if (hasCuota) {
        await client.query(
          `INSERT INTO chorros (
             id, vivienda_id, precio_compra, cantidad, activo,
             fecha_instalacion, fecha_registro, cuota_mensual
           ) VALUES ($1, $2, $3, $4, TRUE, $5, NOW(), 0)`,
          [u.chorroId, u.viviendaId, u.compra, u.cantidad, isoDate(anio, u.mes, u.dia)],
        );
      } else {
        await client.query(
          `INSERT INTO chorros (
             id, vivienda_id, precio_compra, cantidad, activo, fecha_instalacion
           ) VALUES ($1, $2, $3, $4, TRUE, $5)`,
          [u.chorroId, u.viviendaId, u.compra, u.cantidad, isoDate(anio, u.mes, u.dia)],
        );
      }

      const totalTarifa = tarifa * u.cantidad;
      const fechaTarifa = isoDate(anio, u.mes, u.dia);
      const fechaCompra = isoDate(anio, u.mes, Math.min(u.dia + 3, 28));

      secuencia += 1;
      const numTarifa = String(secuencia).padStart(3, "0");
      const reciboTarifaId = randomUUID();
      await client.query(
        `INSERT INTO recibos (
           id, numero_recibo, anio_recibo, secuencia, vivienda_id, tipo_cobro,
           total_pagado, cantidad_en_letras, descripcion_pago, lugar_pago,
           fecha_pago, creado_por
         ) VALUES (
           $1, $2, $3, $4, $5, 'tarifa_anual',
           $6, $7, $8, $9, $10, $11
         )`,
        [
          reciboTarifaId,
          numTarifa,
          anio,
          secuencia,
          u.viviendaId,
          totalTarifa.toFixed(2),
          numeroALetras(totalTarifa),
          `Pago tarifa anual ${anio} — ${u.cantidad} chorro(s)`,
          lugarPago,
          fechaTarifa,
          creadoPor,
        ],
      );
      await client.query(
        `INSERT INTO pagos_anuales (id, recibo_id, chorro_id, anio, monto_pagado)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), reciboTarifaId, u.chorroId, anio, totalTarifa.toFixed(2)],
      );

      secuencia += 1;
      const numCompra = String(secuencia).padStart(3, "0");
      const reciboCompraId = randomUUID();
      await client.query(
        `INSERT INTO recibos (
           id, numero_recibo, anio_recibo, secuencia, vivienda_id, tipo_cobro,
           total_pagado, cantidad_en_letras, descripcion_pago, lugar_pago,
           fecha_pago, creado_por
         ) VALUES (
           $1, $2, $3, $4, $5, 'compra_chorro',
           $6, $7, $8, $9, $10, $11
         )`,
        [
          reciboCompraId,
          numCompra,
          anio,
          secuencia,
          u.viviendaId,
          Number(u.compra).toFixed(2),
          numeroALetras(u.compra),
          `Cobro por compra de chorro (${u.cantidad} unidad(es))`,
          lugarPago,
          fechaCompra,
          creadoPor,
        ],
      );
      await client.query(
        `INSERT INTO pagos_compra_chorro (id, recibo_id, chorro_id, monto_pagado, fecha_pago)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), reciboCompraId, u.chorroId, Number(u.compra).toFixed(2), fechaCompra],
      );

      creados += 1;
      facturas += 2;
    }

    await client.query("COMMIT");

    const resumen = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM usuarios_comunidad WHERE activo) AS usuarios,
         (SELECT COUNT(*)::int FROM viviendas WHERE activa) AS viviendas,
         (SELECT COUNT(*)::int FROM recibos WHERE tipo_cobro = 'tarifa_anual') AS tarifas,
         (SELECT COUNT(*)::int FROM recibos WHERE tipo_cobro = 'compra_chorro') AS compras`,
    );

    console.log(`Seed OK — usuarios creados: ${creados}, ya existían: ${omitidos}, facturas nuevas: ${facturas}`);
    console.log("Totales en BD:", resumen.rows[0]);
    console.log("\nBeneficiarios de prueba (DPI):");
    for (const u of SEEDS) {
      console.log(`- ${u.nombre} | DPI ${u.dpi} | tarifa + compra`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
