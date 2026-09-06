import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  console.error(err);

  const detail =
    process.env.NODE_ENV !== "production" && err instanceof Error
      ? err.message
      : "Error interno del servidor";

  return res.status(500).json({
    success: false,
    message: detail,
  });
}
