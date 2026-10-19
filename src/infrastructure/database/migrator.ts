import { createRequire } from "node:module";
import path from "node:path";
import { Sequelize } from "sequelize";
import { SequelizeStorage, Umzug } from "umzug";

const loadModule = createRequire(__filename);

export function createMigrator(sequelize: Sequelize) {
  return new Umzug({
    migrations: {
      glob: ["migrations/*.{ts,js}", { cwd: __dirname, ignore: "**/*.d.ts" }],
      resolve: ({ name, path: filePath, context }) => {
        const migration = loadModule(filePath as string);
        return {
          name: path.basename(name || (filePath as string)).replace(/\.(ts|js)$/, ""),
          up: async () => migration.up(context),
          down: async () => migration.down(context),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: "migrations" }),
    logger: undefined,
  });
}
