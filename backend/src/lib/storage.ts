import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

function absoluteStorageDir() {
  return path.isAbsolute(env.storageDir)
    ? env.storageDir
    : path.join(process.cwd(), env.storageDir);
}

export async function ensureStorageDir() {
  await fs.mkdir(absoluteStorageDir(), { recursive: true });
}

export async function savePdf(relativePath: string, bytes: Uint8Array) {
  const full = path.join(absoluteStorageDir(), relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, Buffer.from(bytes));
  return full;
}

export async function readPdf(relativePath: string) {
  const full = path.join(absoluteStorageDir(), relativePath);
  return fs.readFile(full);
}

export function publicPdfUrl(reciboId: string) {
  return `${env.publicApiUrl}/api/facturacion/recibos/${reciboId}/pdf`;
}
