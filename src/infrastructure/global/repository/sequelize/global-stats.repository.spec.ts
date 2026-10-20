import { Sequelize } from "sequelize-typescript";
import CovidStats from "../../../../domain/country/value-object/covid-stats";
import GlobalStats from "../../../../domain/global/entity/global-stats";
import GlobalStatsModel from "./global-stats.model";
import GlobalStatsRepository from "./global-stats.repository";

describe("GlobalStats repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([GlobalStatsModel]);
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const build = (cases: number) =>
    new GlobalStats({
      affectedCountries: 200,
      stats: new CovidStats({
        ...CovidStats.empty(),
        cases,
        deaths: 10,
        todayCases: 3,
        todayDeaths: 1,
        updatedAt: new Date("2026-10-17"),
      }),
    });

  it("should return null when nothing was saved", async () => {
    expect(await new GlobalStatsRepository().find()).toBeNull();
  });

  it("should save and overwrite the single row", async () => {
    const repository = new GlobalStatsRepository();
    await repository.save(build(100));
    await repository.save(build(200));

    const found = await repository.find();

    expect(await GlobalStatsModel.count()).toBe(1);
    expect(found?.stats.cases).toBe(200);
    expect(found?.affectedCountries).toBe(200);
    expect(found?.stats.updatedAt).toEqual(new Date("2026-10-17"));
  });
});
