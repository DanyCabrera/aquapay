/** El siguiente número no reasigna recibos conservados: max restante + 1, o 001. */
export function siguienteCorrelativo(
  maxSecuencia: number | null | undefined,
  anio: number,
) {
  const secuencia = (maxSecuencia ?? 0) + 1;
  return {
    secuencia,
    numeroRecibo: String(secuencia).padStart(3, "0"),
    anioRecibo: anio,
  };
}
