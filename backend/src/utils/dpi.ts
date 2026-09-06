export function normalizarDpi(dpi: string): string {
  return dpi.replace(/\D/g, "");
}

export function validarDpi(dpi: string): boolean {
  const limpio = normalizarDpi(dpi);
  return limpio.length >= 13 && limpio.length <= 20;
}
