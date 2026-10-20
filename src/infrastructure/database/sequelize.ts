import { Sequelize } from "sequelize";
import { Sequelize as SequelizeTypescript } from "sequelize-typescript";
import CountryModel from "../country/repository/sequelize/country.model";
import GlobalStatsModel from "../global/repository/sequelize/global-stats.model";
import DailyStatModel from "../history/repository/sequelize/daily-stat.model";

export function createSequelize(databaseUrl: string): Sequelize {
  return new Sequelize(databaseUrl, { dialect: "postgres", logging: false });
}

// Sequelize instance with the ORM models registered, for the API process.
export function createModelSequelize(databaseUrl: string): SequelizeTypescript {
  const sequelize = new SequelizeTypescript(databaseUrl, { dialect: "postgres", logging: false });
  sequelize.addModels([CountryModel, GlobalStatsModel, DailyStatModel]);
  return sequelize;
}
