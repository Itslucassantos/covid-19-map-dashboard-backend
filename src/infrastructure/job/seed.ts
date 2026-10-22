import "dotenv/config";
import { loadConfig } from "../api/config";
import { createSequelize } from "../database/sequelize";
import ApiNinjasGateway from "../covid-data/gateway/api-ninjas/api-ninjas.gateway";
import countries from "../country/dataset/countries.data";
import countryAliases from "../country/dataset/country-aliases";
import SequelizeCovidDataSeedRepository from "../sync/repository/sequelize/covid-data-seed.repository";
import SeedCovidDataUseCase from "../../usecase/sync/seed-covid-data/seed.covid-data.usecase";

const log = (message: Record<string, unknown>) => console.log(JSON.stringify(message));

async function main() {
  const config = loadConfig();
  if (!config.API_NINJAS_KEY) throw new Error("API_NINJAS_KEY is required to run the seed");

  const sequelize = createSequelize(config.DATABASE_URL);
  try {
    const useCase = new SeedCovidDataUseCase(
      new ApiNinjasGateway({ apiKey: config.API_NINJAS_KEY }),
      new SequelizeCovidDataSeedRepository(sequelize),
      { countries, extraAliases: countryAliases, log },
    );
    const output = await useCase.execute();
    log({ msg: "seed finished", ...output });
    if (output.skippedCountries.length > 0) {
      log({
        msg: "countries without data in the source",
        iso2: output.skippedCountries.map((country) => country.iso2),
      });
    }
    if (output.failedCountries.length > 0) process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
