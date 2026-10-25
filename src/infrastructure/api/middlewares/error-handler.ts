import { NextFunction, Request, Response } from "express";
import NotificationError from "../../../domain/@shared/notification/notification.error";
import { Logger, jsonLogger } from "../logger";
import CountryNotFoundError from "../../../domain/country/error/country-not-found.error";

export class ValidationError extends Error {
  constructor() {
    super("Validation error");
    this.name = "ValidationError";
  }
}

export function createErrorHandler(logger: Logger = jsonLogger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void =>
    handleError(logger, err, req, res);
}

function handleError(logger: Logger, err: unknown, req: Request, res: Response): void {
  const body = (code: string) => ({ error: { code, requestId: req.id } });

  if (err instanceof CountryNotFoundError) {
    res.status(404).json(body("COUNTRY_NOT_FOUND"));
    return;
  }
  if (err instanceof ValidationError || err instanceof NotificationError) {
    res.status(400).json(body("VALIDATION_ERROR"));
    return;
  }

  logger.error("unhandled error", { requestId: req.id, error: String(err) });
  res.status(500).json(body("INTERNAL_ERROR"));
}
