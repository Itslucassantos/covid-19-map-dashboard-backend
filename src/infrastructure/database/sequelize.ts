import { Sequelize } from "sequelize";

export function createSequelize(databaseUrl: string): Sequelize {
  return new Sequelize(databaseUrl, { dialect: "postgres", logging: false });
}
