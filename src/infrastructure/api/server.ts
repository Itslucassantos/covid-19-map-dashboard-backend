import "dotenv/config";
import "reflect-metadata";
import { createApp } from "./express";
import { loadConfig, parseCorsOrigins } from "./config";
import { jsonLogger as logger } from "./logger";
import { createModelSequelize } from "../database/sequelize";
import CountryRepository from "../country/repository/sequelize/country.repository";
import DailyStatRepository from "../history/repository/sequelize/daily-stat.repository";
import GlobalStatsRepository from "../global/repository/sequelize/global-stats.repository";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = loadConfig();
const sequelize = createModelSequelize(config.DATABASE_URL);
const app = createApp({
  corsOrigin: parseCorsOrigins(config.CORS_ORIGIN),
  logger,
  countryRepository: new CountryRepository(),
  globalStatsRepository: new GlobalStatsRepository(),
  dailyStatRepository: new DailyStatRepository(),
});

async function bootstrap() {
  await sequelize.authenticate();
  const server = app.listen(config.PORT, () => {
    logger.info("server listening", { port: config.PORT });
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info("shutting down", { signal });

    setTimeout(() => {
      logger.error("shutdown timed out");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    server.close(async (serverError) => {
      try {
        await sequelize.close();
      } catch (error) {
        logger.error("database close failed", { error: String(error) });
        process.exit(1);
      }
      process.exit(serverError ? 1 : 0);
    });
    server.closeIdleConnections();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error("startup failed", { error: String(error) });
  process.exit(1);
});
