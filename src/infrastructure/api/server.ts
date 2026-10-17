import "dotenv/config";
import "reflect-metadata";
import { createApp } from "./express";
import { loadConfig } from "./config";

const config = loadConfig();
const app = createApp({ corsOrigin: config.CORS_ORIGIN });

app.listen(config.PORT, () => {
  console.log(JSON.stringify({ msg: "server listening", port: config.PORT }));
});
