import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error-handler";
import { requestId } from "./middlewares/request-id";

export function createApp(options: { corsOrigin: string }): Express {
  const app = express();
  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", requestId: req.id } });
  });
  app.use(errorHandler);
  return app;
}
