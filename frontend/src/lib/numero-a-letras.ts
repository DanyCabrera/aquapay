/** Convierte un monto a letras en quetzales (vista previa en UI). */
const UNIDADES = [
  "", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiún", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function seccion(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  if (n < 30) return UNIDADES[n];
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  const resto = n % 100;
  let texto = CENTENAS[c] ? `${CENTENAS[c]} ` : "";
  if (resto < 30) texto += UNIDADES[resto];
  else if (u === 0) texto += DECENAS[d];
  else texto += `${DECENAS[d]} y ${UNIDADES[u]}`;
  return texto.trim();
}

function miles(n: number): string {
  if (n < 1000) return seccion(n);
  const m = Math.floor(n / 1000);
  const r = n % 1000;
  const prefijo = m === 1 ? "mil" : `${seccion(m)} mil`;
  return r === 0 ? prefijo : `${prefijo} ${seccion(r)}`;
}

function millones(n: number): string {
  if (n < 1_000_000) return miles(n);
  const mill = Math.floor(n / 1_000_000);
  const r = n % 1_000_000;
  const prefijo = mill === 1 ? "un millón" : `${miles(mill)} millones`;
  return r === 0 ? prefijo : `${prefijo} ${miles(r)}`;
}

export function numeroALetras(monto: number): string {
  const entero = Math.floor(Math.abs(monto));
  const centavos = Math.round((Math.abs(monto) - entero) * 100);
  let texto =
    entero === 0
      ? "cero quetzales"
      : entero === 1
        ? "un quetzal"
        : `${millones(entero)} quetzales`;
  if (centavos > 0) texto += ` con ${centavos.toString().padStart(2, "0")}/100`;
  else texto += " exactos";
  return texto.toUpperCase();
}
