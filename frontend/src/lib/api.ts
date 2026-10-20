function resolveApiUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100")
    .trim()
    .replace(/\/$/, "");
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "aquapay_token";
const USER_KEY = "aquapay_user";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
}

function isPublicAuth(path: string) {
  return (
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/registro") ||
    path.startsWith("/api/auth/restablecer-password")
  );
}

/** La sesión local ya no sirve. El AuthProvider escucha este aviso y vuelve al login. */
function dropInvalidSession(path: string, token: string | null, status: number) {
  if (status !== 401 || !token || isPublicAuth(path)) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("aquapay_mfa_ok");
  window.dispatchEvent(new Event("aquapay:unauthorized"));
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "No hay conexión con el servidor. Confirme que el backend está en marcha.",
      0,
    );
  }

  if (res.headers.get("content-type")?.includes("application/pdf")) {
    if (!res.ok) {
      dropInvalidSession(path, token, res.status);
      throw new ApiError("No se pudo abrir el PDF del recibo.", res.status);
    }
    const blob = await res.blob();
    return blob as T;
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    dropInvalidSession(path, token, res.status);
    throw new ApiError(json.message ?? "Error de servidor", res.status);
  }
  return (json.data ?? json) as T;
}

export function fetchReciboPdf(reciboId: string) {
  return api<Blob>(`/api/facturacion/recibos/${reciboId}/pdf`);
}

export function blobFromBase64Pdf(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBase64Pdf(base64: string, filename: string) {
  downloadBlob(blobFromBase64Pdf(base64), filename);
}
