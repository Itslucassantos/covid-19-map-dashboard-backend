import { Sequelize } from "sequelize-typescript";
import DailyStat from "../../../../domain/history/entity/daily-stat";
import DailyStatModel from "./daily-stat.model";
import DailyStatRepository from "./daily-stat.repository";

describe("DailyStat repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([DailyStatModel]);
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const stat = (countryIso2: string | null, day: number) =>
    new DailyStat({
      countryIso2,
      date: `2026-01-${String(day).padStart(2, "0")}`,
      cases: day * 10,
      deaths: day,
      newCases: 10,
      newDeaths: 1,
    });

  it("should return the last N days in ascending order for one scope", async () => {
    const repository = new DailyStatRepository();
    await repository.createMany([
      stat("BR", 1),
      stat("BR", 2),
      stat("BR", 3),
      stat("AR", 3),
      stat(null, 3),
    ]);

    const brazil = await repository.findLast("BR", 2);
    const global = await repository.findLast(null, 30);

    expect(brazil.map((s) => s.date)).toEqual(["2026-01-02", "2026-01-03"]);
    expect(brazil[1].cases).toBe(30);
    expect(global).toHaveLength(1);
    expect(global[0].countryIso2).toBeNull();
  });
});
