import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Perfil, RolSistema } from "../entities/Perfil";
import { verifyAccessToken } from "../utils/jwt";
import { forbidden, unauthorized } from "../utils/errors";

export interface AuthUser {
  id: string;
  dpi: string;
  nombre: string;
  rol: RolSistema;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized("Token requerido");
    }

    const token = header.slice(7);
    const payload = await verifyAccessToken(token);

    const perfil = await AppDataSource.getRepository(Perfil).findOne({
      where: { id: payload.sub },
    });

    if (!perfil || !perfil.activo) {
      throw unauthorized("Perfil inactivo o no encontrado");
    }

    req.user = {
      id: perfil.id,
      dpi: perfil.dpi,
      nombre: perfil.nombre,
      rol: perfil.rol,
    };

    next();
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return next(error);
    }
    next(unauthorized("Sesión inválida o expirada"));
  }
}

export function requireRoles(...roles: RolSistema[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return next(forbidden("No tiene permisos para esta acción"));
    }
    next();
  };
}
