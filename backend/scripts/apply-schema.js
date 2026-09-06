const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const sql = fs.readFileSync(
    path.join(__dirname, "../src/database/schema.sql"),
    "utf8",
  );
  await client.query(sql);
  console.log("Schema applied OK");

  const r = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'perfiles' ORDER BY ordinal_position`,
  );
  console.log(
    "perfiles:",
    r.rows.map((x) => x.column_name).join(", "),
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
