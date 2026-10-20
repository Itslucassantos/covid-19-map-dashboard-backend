import { Sequelize } from "sequelize";
import CovidDataSeedRepository, {
  SeedData,
} from "../../../../domain/sync/repository/covid-data-seed-repository.interface";

const CHUNK_SIZE = 1000;

export default class SequelizeCovidDataSeedRepository implements CovidDataSeedRepository {
  constructor(private readonly sequelize: Sequelize) {}

  async save(data: SeedData): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const queryInterface = this.sequelize.getQueryInterface();

      await this.sequelize.query("DELETE FROM daily_stats", { transaction });

      for (const country of data.countries) {
        await this.sequelize.query(
          `INSERT INTO countries (iso2, iso3, name, lat, lng, population, cases, deaths, today_cases,
             today_deaths, cases_per_million, deaths_per_million, updated_at)
           VALUES (:iso2, :iso3, :name, :lat, :lng, :population, :cases, :deaths, :todayCases,
             :todayDeaths, :casesPerMillion, :deathsPerMillion, :updatedAt)
           ON CONFLICT (iso2) DO UPDATE SET
             iso3 = EXCLUDED.iso3, name = EXCLUDED.name, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
             population = EXCLUDED.population, cases = EXCLUDED.cases, deaths = EXCLUDED.deaths,
             today_cases = EXCLUDED.today_cases, today_deaths = EXCLUDED.today_deaths,
             cases_per_million = EXCLUDED.cases_per_million,
             deaths_per_million = EXCLUDED.deaths_per_million, updated_at = EXCLUDED.updated_at`,
          { replacements: country, transaction },
        );
      }

      if (data.global) {
        await this.sequelize.query(
          `INSERT INTO global_stats (id, cases, deaths, today_cases, today_deaths, affected_countries, updated_at)
           VALUES (1, :cases, :deaths, :todayCases, :todayDeaths, :affectedCountries, :updatedAt)
           ON CONFLICT (id) DO UPDATE SET
             cases = EXCLUDED.cases, deaths = EXCLUDED.deaths, today_cases = EXCLUDED.today_cases,
             today_deaths = EXCLUDED.today_deaths, affected_countries = EXCLUDED.affected_countries,
             updated_at = EXCLUDED.updated_at`,
          { replacements: data.global, transaction },
        );
      }

      const rows = data.dailyStats.map((stat) => ({
        country_iso2: stat.countryIso2,
        date: stat.date,
        cases: stat.cases,
        deaths: stat.deaths,
        new_cases: stat.newCases,
        new_deaths: stat.newDeaths,
      }));
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        await queryInterface.bulkInsert("daily_stats", rows.slice(i, i + CHUNK_SIZE), {
          transaction,
        });
      }
    });
  }
}
