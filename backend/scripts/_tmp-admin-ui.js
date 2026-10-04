require("dotenv").config();
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const DPI = "9990000000009";
const PASSWORD = "AquaPayHist1!";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const hash = await bcrypt.hash(PASSWORD, 12);
  await client.query(
    `INSERT INTO perfiles (id, nombre, dpi, password_hash, rol, mfa_habilitado, activo)
     VALUES ($1, $2, $3, $4, 'administrador', false, true)
     ON CONFLICT (dpi) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol = 'administrador', activo = true`,
    [randomUUID(), "Verificacion Admin UI", DPI, hash],
  );
  console.log("ok");
  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
