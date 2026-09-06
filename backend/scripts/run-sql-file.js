require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function splitStatements(sql) {
  const parts = [];
  let current = "";
  let inDo = false;

  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!inDo && trimmed.startsWith("--")) continue;

    if (!inDo && /^DO\s+\$\$/i.test(trimmed)) {
      inDo = true;
      current += `${line}\n`;
      continue;
    }

    current += `${line}\n`;

    if (inDo && /END\s*\$\$\s*;/i.test(trimmed)) {
      parts.push(current.trim());
      current = "";
      inDo = false;
      continue;
    }

    if (!inDo && trimmed.endsWith(";")) {
      parts.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Uso: node scripts/run-sql-file.js <ruta.sql>");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está definida");

  const sqlPath = path.resolve(file);
  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = splitStatements(sql);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.query(stmt);
      console.log(`OK [${i + 1}/${statements.length}]`);
    } catch (err) {
      console.error(`FAIL [${i + 1}/${statements.length}]`);
      console.error(stmt.slice(0, 180).replace(/\s+/g, " "));
      throw err;
    }
  }

  const after = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN (
         'usuarios_comunidad', 'viviendas', 'chorros', 'recibos', 'perfiles'
       )
     ORDER BY table_name, ordinal_position`,
  );

  const grouped = after.rows.reduce((acc, row) => {
    acc[row.table_name] = acc[row.table_name] || [];
    acc[row.table_name].push(row.column_name);
    return acc;
  }, {});

  for (const [table, cols] of Object.entries(grouped)) {
    console.log(`${table}: ${cols.join(", ")}`);
  }

  await client.end();
  console.log("OK:", path.basename(sqlPath));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
