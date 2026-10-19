// Datos ficticios de demostración. No corresponden a identidades verificadas.
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const nombres = [
  "María Fernanda López García", "José Manuel Pérez Hernández", "Ana Lucía Ramírez Morales",
  "Carlos Alberto Méndez Vásquez", "Rosa Elena García de León", "Luis Fernando Morales Ruiz",
  "Marta Isabel Hernández Castillo", "Juan Carlos Vásquez López", "Claudia Patricia Díaz Pérez",
  "Pedro Antonio Castillo Gómez", "Sandra Elizabeth Gómez Ramírez", "Miguel Ángel Ruiz Méndez",
  "Gloria Estela de León Sánchez", "Francisco Javier Sánchez Díaz", "Silvia Lorena Cruz Aguilar",
  "Héctor Eduardo Aguilar Reyes", "Carmen Beatriz Reyes Mendoza", "Oscar Daniel Mendoza Cabrera",
  "Teresa de Jesús Cabrera Ortiz", "Roberto Enrique Ortiz Cruz",
];
const sectores = ["Sector Centro", "Sector La Escuela", "Sector El Campo", "Sector Los Pinos", "Sector La Ceiba"];
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:4100";

async function main() {
  let credentials = {};
  try { credentials = JSON.parse(readFileSync(resolve(__dirname, "../../frontend/cypress.env.json"), "utf8")); } catch { /* usar variables de entorno */ }
  let token;
  async function request(path, method = "GET", body) {
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    });
    const result = await res.json();
    if (res.status === 404 && method === "GET") return null;
    if (!res.ok) throw new Error(`${method} ${path}: ${result.message ?? res.status}`);
    return result.data ?? result;
  }
  const auth = await request("/api/auth/login", "POST", {
    dpi: process.env.E2E_ADMIN_DPI ?? credentials.adminDpi,
    password: process.env.E2E_ADMIN_PASSWORD ?? credentials.adminPassword,
  });
  if (auth.usuario.rol !== "administrador") throw new Error("Se requiere una cuenta ADMIN.");
  token = auth.accessToken;
  let creados = 0;
  const registros = [];
  for (const [index, nombreCompleto] of nombres.entries()) {
    const dpi = String(9902600000001 + index);
    let persona = await request(`/api/usuarios/dpi/${dpi}`);
    if (persona && persona.nombreCompleto !== nombreCompleto) throw new Error("El DPI reservado de demostración ya pertenece a otro registro.");
    if (!persona) {
      persona = await request("/api/usuarios", "POST", { nombreCompleto, dpi, telefono: `5550${String(1001 + index)}` });
      creados += 1;
    }
    const cantidadViviendas = index % 5 === 0 ? 2 : 1;
    for (let casa = 0; casa < cantidadViviendas; casa++) {
      const direccion = `${sectores[index % sectores.length]}, calle ${index % 4 + 1}, casa ${index + 1}${casa ? " B" : ""}, Aldea Sibaná, El Asintal`;
      persona = await request(`/api/usuarios/${persona.id}`);
      let vivienda = persona.viviendas.find((item) => item.direccion === direccion);
      if (!vivienda) vivienda = await request(`/api/usuarios/${persona.id}/viviendas`, "POST", { direccion, anioInicioCobro: 2026 - index % 4 });
      if (!(vivienda.chorros ?? []).length) {
        const cantidad = index % 6 === 0 && casa === 0 ? 2 : 1;
        await request(`/api/usuarios/viviendas/${vivienda.id}/chorros`, "POST", {
          cantidad, precioCompra: cantidad * 1500,
          fechaInstalacion: `${2026 - index % 4}-${String(index % 9 + 1).padStart(2, "0")}-${String(index % 24 + 1).padStart(2, "0")}`,
        });
      }
    }
    persona = await request(`/api/usuarios/${persona.id}`);
    if (!persona.telefono || persona.viviendas.length !== cantidadViviendas || persona.viviendas.some((v) => !v.chorros?.length)) throw new Error(`Registro incompleto: ${nombreCompleto}`);
    registros.push(persona);
  }
  console.log(JSON.stringify({
    tipo: "Datos ficticios de demostración", creados, beneficiariosVerificados: registros.length,
    viviendas: registros.reduce((n, u) => n + u.viviendas.length, 0),
    chorros: registros.reduce((n, u) => n + u.viviendas.reduce((s, v) => s + v.chorros.reduce((t, c) => t + c.cantidad, 0), 0), 0),
    recibosGenerados: 0,
  }, null, 2));
}
main().catch((err) => { console.error(err.message); process.exitCode = 1; });
