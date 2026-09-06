import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env";
import { RolSistema } from "../entities/Perfil";

const secret = new TextEncoder().encode(env.jwtSecret);

export type JwtPayload = {
  sub: string;
  dpi: string;
  nombre: string;
  rol: RolSistema;
};

function parseExpiresToSeconds(value: string): number {
  const m = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!m) return 8 * 60 * 60;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 60 * 60;
    case "d":
      return n * 60 * 60 * 24;
    default:
      return 8 * 60 * 60;
  }
}

export async function signAccessToken(payload: JwtPayload) {
  const expiresIn = parseExpiresToSeconds(env.jwtExpiresIn);
  const token = await new SignJWT({
    dpi: payload.dpi,
    nombre: payload.nombre,
    rol: payload.rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer("aquapay")
    .setAudience("aquapay-api")
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  return { token, expiresIn };
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer: "aquapay",
    audience: "aquapay-api",
  });

  const sub = payload.sub;
  if (!sub) throw new Error("Token sin sujeto");

  return {
    sub,
    dpi: String(payload.dpi ?? ""),
    nombre: String(payload.nombre ?? ""),
    rol: payload.rol as RolSistema,
  };
}
