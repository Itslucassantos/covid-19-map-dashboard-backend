import DailyStat from "../../../domain/history/entity/daily-stat";
import FindGlobalHistoryUseCase from "./find.global-history.usecase";

describe("Unit test find global history use case", () => {
  it("should return the global series", async () => {
    const dailyStatRepository = {
      createMany: jest.fn(),
      findLast: jest.fn().mockResolvedValue([
        new DailyStat({
          countryIso2: null,
          date: "2026-01-01",
          cases: 100,
          deaths: 5,
          newCases: 20,
          newDeaths: 1,
        }),
      ]),
    };

    const output = await new FindGlobalHistoryUseCase(dailyStatRepository).execute({ days: 7 });

    expect(dailyStatRepository.findLast).toHaveBeenCalledWith(null, 7);
    expect(output.history).toEqual([
      { date: "2026-01-01", cases: 100, deaths: 5, newCases: 20, newDeaths: 1 },
    ]);
  });
});
