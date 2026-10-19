import "dotenv/config";
import { loadConfig } from "../api/config";
import { createSequelize } from "./sequelize";
import { createMigrator } from "./migrator";

async function main() {
  const config = loadConfig();
  const sequelize = createSequelize(config.DATABASE_URL);
  const migrator = createMigrator(sequelize);
  const direction = process.argv[2] === "down" ? "down" : "up";
  const result = direction === "down" ? await migrator.down() : await migrator.up();
  console.log(
    JSON.stringify({ msg: "migrations applied", direction, migrations: result.map((m) => m.name) }),
  );
  await sequelize.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
