export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string, code?: string) {
  return new AppError(400, message, code);
}

export function unauthorized(message = "No autorizado") {
  return new AppError(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "Acceso denegado") {
  return new AppError(403, message, "FORBIDDEN");
}

export function notFound(message = "Recurso no encontrado") {
  return new AppError(404, message, "NOT_FOUND");
}

export function conflict(message: string) {
  return new AppError(409, message, "CONFLICT");
}
