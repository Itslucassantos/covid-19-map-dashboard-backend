import { Sequelize } from "sequelize-typescript";
import CovidStats from "../../../domain/country/value-object/covid-stats";
import GlobalStats from "../../../domain/global/entity/global-stats";
import GlobalStatsModel from "../../../infrastructure/global/repository/sequelize/global-stats.model";
import GlobalStatsRepository from "../../../infrastructure/global/repository/sequelize/global-stats.repository";
import FindGlobalStatsUseCase from "./find.global-stats.usecase";

describe("Integration test find global stats use case", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([GlobalStatsModel]);
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should find persisted global stats", async () => {
    const repository = new GlobalStatsRepository();
    await repository.save(
      new GlobalStats({
        affectedCountries: 10,
        stats: new CovidStats({ ...CovidStats.empty(), cases: 50, deaths: 2 }),
      }),
    );

    const output = await new FindGlobalStatsUseCase(repository).execute();

    expect(output).toMatchObject({ cases: 50, deaths: 2, affectedCountries: 10 });
  });
});
