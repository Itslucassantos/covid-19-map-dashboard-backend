import "dotenv/config";
import "reflect-metadata";
import { createApp } from "./express";
import { loadConfig } from "./config";
import { createSequelize } from "../database/sequelize";

const config = loadConfig();
const sequelize = createSequelize(config.DATABASE_URL);
const app = createApp({ corsOrigin: config.CORS_ORIGIN });

async function bootstrap() {
  await sequelize.authenticate();
  app.listen(config.PORT, () => {
    console.log(JSON.stringify({ msg: "server listening", port: config.PORT }));
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
