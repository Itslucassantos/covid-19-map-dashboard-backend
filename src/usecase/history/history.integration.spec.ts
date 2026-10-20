import { Sequelize } from "sequelize-typescript";
import CountryFactory from "../../domain/country/factory/country.factory";
import DailyStat from "../../domain/history/entity/daily-stat";
import CountryModel from "../../infrastructure/country/repository/sequelize/country.model";
import CountryRepository from "../../infrastructure/country/repository/sequelize/country.repository";
import DailyStatModel from "../../infrastructure/history/repository/sequelize/daily-stat.model";
import DailyStatRepository from "../../infrastructure/history/repository/sequelize/daily-stat.repository";
import FindCountryHistoryUseCase from "./find-country/find.country-history.usecase";
import FindGlobalHistoryUseCase from "./find-global/find.global-history.usecase";

describe("Integration test history use cases", () => {
  let sequelize: Sequelize;
  const countryRepository = new CountryRepository();
  const dailyStatRepository = new DailyStatRepository();

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([CountryModel, DailyStatModel]);
    await sequelize.sync({ force: true });
    await countryRepository.create(
      CountryFactory.create({
        iso2: "BR",
        iso3: "BRA",
        name: "Brazil",
        lat: 0,
        lng: 0,
        population: null,
      }),
    );
    const stat = (countryIso2: string | null, day: number) =>
      new DailyStat({
        countryIso2,
        date: `2026-01-0${day}`,
        cases: day * 10,
        deaths: day,
        newCases: 10,
        newDeaths: 1,
      });
    await dailyStatRepository.createMany([stat("BR", 1), stat("BR", 2), stat(null, 1)]);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should find the country history limited by days", async () => {
    const output = await new FindCountryHistoryUseCase(
      countryRepository,
      dailyStatRepository,
    ).execute({ iso2: "BR", days: 1 });

    expect(output.history.map((p) => p.date)).toEqual(["2026-01-02"]);
  });

  it("should find the global history", async () => {
    const output = await new FindGlobalHistoryUseCase(dailyStatRepository).execute({ days: 30 });

    expect(output.history).toHaveLength(1);
  });
});
