require("dotenv").config();
const { Client } = require("pg");
const { randomUUID } = require("crypto");

/**
 * Datos de prueba para facturación:
 * - usuarios de comunidad
 * - viviendas
 * - chorros (algunos con precio de compra > 0)
 * anio_inicio_cobro en años anteriores para generar pendientes.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const anioActual = new Date().getFullYear();
  const seeds = [
    {
      id: randomUUID(),
      nombre: "María Elena López García",
      dpi: "2398456120101",
      telefono: "5523-4410",
      viviendas: [
        {
          id: randomUUID(),
          direccion: "Calle Principal 12, Sector 1, Aldea Sibaná",
          anioInicio: anioActual - 2,
          chorros: [
            { id: randomUUID(), cantidad: 1, precioCompra: 350, activo: true },
          ],
        },
      ],
    },
    {
      id: randomUUID(),
      nombre: "José Antonio Pérez Méndez",
      dpi: "1847365290102",
      telefono: "4788-2215",
      viviendas: [
        {
          id: randomUUID(),
          direccion: "Caserío El Llano, casa 4",
          anioInicio: anioActual - 3,
          chorros: [
            { id: randomUUID(), cantidad: 2, precioCompra: 0, activo: true },
          ],
        },
        {
          id: randomUUID(),
          direccion: "Caserío El Llano, casa 7 (terreno familiar)",
          anioInicio: anioActual - 1,
          chorros: [
            { id: randomUUID(), cantidad: 1, precioCompra: 500, activo: true },
          ],
        },
      ],
    },
    {
      id: randomUUID(),
      nombre: "Ana Sofía Ramírez Cruz",
      dpi: "3019284750103",
      telefono: "4167-9033",
      viviendas: [
        {
          id: randomUUID(),
          direccion: "Cantón Centro, frente a la iglesia",
          anioInicio: anioActual - 1,
          chorros: [
            { id: randomUUID(), cantidad: 1, precioCompra: 280, activo: true },
            { id: randomUUID(), cantidad: 1, precioCompra: 0, activo: true },
          ],
        },
      ],
    },
    {
      id: randomUUID(),
      nombre: "Carlos Eduardo Morales Díaz",
      dpi: "2756183940104",
      telefono: "5032-1188",
      viviendas: [
        {
          id: randomUUID(),
          direccion: "Zona alta, pasaje Los Pinos 3",
          anioInicio: anioActual,
          chorros: [
            { id: randomUUID(), cantidad: 1, precioCompra: 400, activo: true },
          ],
        },
      ],
    },
    {
      id: randomUUID(),
      nombre: "Rosa Isabel Hernández Ruiz",
      dpi: "1982736450105",
      telefono: null,
      viviendas: [
        {
          id: randomUUID(),
          direccion: "Orilla del río, vivienda 2",
          anioInicio: anioActual - 4,
          chorros: [
            { id: randomUUID(), cantidad: 3, precioCompra: 0, activo: true },
          ],
        },
      ],
    },
  ];

  try {
    await client.query("BEGIN");

    // Asegura tarifa de configuración
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

    let creados = 0;
    let omitidos = 0;

    for (const u of seeds) {
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

      for (const v of u.viviendas) {
        await client.query(
          `INSERT INTO viviendas (id, usuario_id, direccion, activa, anio_inicio_cobro)
           VALUES ($1, $2, $3, TRUE, $4)`,
          [v.id, u.id, v.direccion, v.anioInicio],
        );

        for (const c of v.chorros) {
          await client.query(
            `INSERT INTO chorros (
               id, vivienda_id, precio_compra, cantidad, activo,
               fecha_instalacion, fecha_registro, cuota_mensual
             ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, NOW(), 0)`,
            [c.id, v.id, c.precioCompra, c.cantidad, c.activo],
          );
        }
      }

      creados += 1;
    }

    await client.query("COMMIT");

    const resumen = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM usuarios_comunidad) AS usuarios,
         (SELECT COUNT(*)::int FROM viviendas) AS viviendas,
         (SELECT COUNT(*)::int FROM chorros WHERE activo) AS chorros`,
    );

    console.log(`Seed OK — creados: ${creados}, ya existían: ${omitidos}`);
    console.log("Totales en BD:", resumen.rows[0]);
    console.log("\nUsuarios de prueba (DPI):");
    for (const u of seeds) {
      console.log(`- ${u.nombre} | DPI ${u.dpi}`);
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
