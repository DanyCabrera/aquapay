import { downloadBlob } from "./api";

export function exportCsv(filename: string, columns: string[], rows: string[][]) {
  function cell(value: string) {
    const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  }
  const csv = [columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), filename);
}
