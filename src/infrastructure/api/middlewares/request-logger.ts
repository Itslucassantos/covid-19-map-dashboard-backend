import { NextFunction, Request, Response } from "express";
import { Logger } from "../logger";

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      logger.info("request", {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - start) / 1e6,
      });
    });
    next();
  };
}
