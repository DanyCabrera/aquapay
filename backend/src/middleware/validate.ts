import { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { badRequest } from "../utils/errors";

type ClassType<T> = new (...args: unknown[]) => T;

export function validateBody<T extends object>(DtoClass: ClassType<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const instance = plainToInstance(DtoClass, req.body, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join("; ");
      return next(badRequest(messages || "Datos inválidos"));
    }

    req.body = instance;
    next();
  };
}
