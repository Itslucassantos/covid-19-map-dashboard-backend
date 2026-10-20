import { Request } from "express";
import { ValidationError } from "../middlewares/error-handler";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

export function parseDays(req: Request): number {
  const raw = req.query.days;
  if (raw === undefined) {
    return DEFAULT_DAYS;
  }
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new ValidationError();
  }
  const days = Number(raw);
  if (days < 1 || days > MAX_DAYS) {
    throw new ValidationError();
  }
  return days;
}
