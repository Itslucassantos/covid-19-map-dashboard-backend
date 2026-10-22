import express, { Express, RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import CountryRepositoryInterface from "../../domain/country/repository/country-repository.interface";
import DailyStatRepositoryInterface from "../../domain/history/repository/daily-stat-repository.interface";
import GlobalStatsRepositoryInterface from "../../domain/global/repository/global-stats-repository.interface";
import { countryRoute } from "./routes/country.route";
import { globalRoute } from "./routes/global.route";
import { createErrorHandler } from "./middlewares/error-handler";
import { requestId } from "./middlewares/request-id";
import { requestLogger } from "./middlewares/request-logger";
import { Logger, silentLogger } from "./logger";

export type AppOptions = {
  corsOrigin: string | string[];
  rateLimitPerMinute?: number;
  logger?: Logger;
  countryRepository?: CountryRepositoryInterface;
  globalStatsRepository?: GlobalStatsRepositoryInterface;
  dailyStatRepository?: DailyStatRepositoryInterface;
};

const cacheControl: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  next();
};

export function createApp(options: AppOptions): Express {
  const app = express();
  const logger = options.logger ?? silentLogger;
  app.use(requestId);
  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(
    cors({
      origin: options.corsOrigin,
      methods: ["GET", "HEAD", "OPTIONS"],
      exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
      maxAge: 600,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: options.rateLimitPerMinute ?? 120,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({ error: { code: "RATE_LIMITED", requestId: req.id } });
      },
    }),
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  if (options.countryRepository) {
    app.use(
      "/api/countries",
      cacheControl,
      countryRoute(options.countryRepository, options.dailyStatRepository),
    );
  }
  if (options.globalStatsRepository) {
    app.use(
      "/api/global",
      cacheControl,
      globalRoute(options.globalStatsRepository, options.dailyStatRepository),
    );
  }

  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", requestId: req.id } });
  });
  app.use(createErrorHandler(logger));
  return app;
}
