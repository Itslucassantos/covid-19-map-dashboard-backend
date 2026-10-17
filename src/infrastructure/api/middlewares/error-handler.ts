import { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error(JSON.stringify({ requestId: req.id, error: String(err) }));
  res.status(500).json({ error: { code: "INTERNAL_ERROR", requestId: req.id } });
}
