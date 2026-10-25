import CovidStats from "../../../domain/country/value-object/covid-stats";
import GlobalStats from "../../../domain/global/entity/global-stats";
import FindGlobalStatsUseCase from "./find.global-stats.usecase";

describe("Unit test find global stats use case", () => {
  it("should return the stored totals", async () => {
    const stored = new GlobalStats({
      affectedCountries: 200,
      stats: new CovidStats({
        ...CovidStats.empty(),
        cases: 100,
        deaths: 5,
        updatedAt: new Date("2026-10-17"),
      }),
    });
    const repository = { save: jest.fn(), find: jest.fn().mockResolvedValue(stored) };

    const output = await new FindGlobalStatsUseCase(repository).execute();

    expect(output.cases).toBe(100);
    expect(output.affectedCountries).toBe(200);
    expect(output.updatedAt).toEqual(new Date("2026-10-17"));
  });

  it("should return zeros before the first sync", async () => {
    const repository = { save: jest.fn(), find: jest.fn().mockResolvedValue(null) };

    const output = await new FindGlobalStatsUseCase(repository).execute();

    expect(output).toMatchObject({ cases: 0, deaths: 0, affectedCountries: 0, updatedAt: null });
  });
});
