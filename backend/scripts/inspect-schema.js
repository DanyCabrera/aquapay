require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const tables = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
     ORDER BY 1`,
  );
  console.log("Tablas:", tables.rows.map((r) => r.table_name).join(", "));

  for (const t of [
    "usuarios_comunidad",
    "viviendas",
    "recibos",
    "configuracion",
    "chorros",
    "pagos_anuales",
    "perfiles",
  ]) {
    const cols = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [t],
    );
    console.log(
      `${t}:`,
      cols.rows.map((r) => r.column_name).join(", ") || "(no existe)",
    );
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
