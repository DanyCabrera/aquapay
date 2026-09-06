require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "src", "database", "migrations", "001_add_mfa_columns.sql"),
    "utf8",
  );

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const before = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'perfiles'
     ORDER BY ordinal_position`,
  );
  console.log(
    "Columnas antes:",
    before.rows.map((r) => r.column_name).join(", "),
  );

  await client.query(sql);

  const after = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'perfiles'
     ORDER BY ordinal_position`,
  );
  console.log(
    "Columnas despues:",
    after.rows.map((r) => r.column_name).join(", "),
  );

  await client.end();
  console.log("Migracion OK");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
