import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno faltante: ${name}`);
  }
  return value;
}

function publicApiUrl(): string {
  const explicit = process.env.PUBLIC_API_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  if ((process.env.NODE_ENV ?? "development") === "production") {
    throw new Error("Variable de entorno faltante: PUBLIC_API_URL");
  }
  return `http://localhost:${process.env.PORT ?? 4000}`;
}

function frontendOrigins(): string[] {
  const configured = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if ((process.env.NODE_ENV ?? "development") !== "production") {
    return Array.from(
      new Set([...configured, "http://localhost:3000", "http://localhost:3001"]),
    );
  }
  if (configured.length === 0) {
    throw new Error("Variable de entorno faltante: FRONTEND_URL");
  }
  return configured;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigins: frontendOrigins(),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  storageDir: process.env.STORAGE_DIR ?? "uploads/recibos",
  publicApiUrl: publicApiUrl(),
  pdfSignP12Path: process.env.PDF_SIGN_P12_PATH ?? "",
  pdfSignP12Password: process.env.PDF_SIGN_P12_PASSWORD ?? "",
};
