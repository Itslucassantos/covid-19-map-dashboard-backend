import DailyStat from "../../../../domain/history/entity/daily-stat";
import DailyStatRepositoryInterface from "../../../../domain/history/repository/daily-stat-repository.interface";
import DailyStatModel from "./daily-stat.model";

export default class DailyStatRepository implements DailyStatRepositoryInterface {
  async createMany(stats: DailyStat[]): Promise<void> {
    await DailyStatModel.bulkCreate(
      stats.map((stat) => ({
        countryIso2: stat.countryIso2,
        date: stat.date,
        cases: stat.cases,
        deaths: stat.deaths,
        newCases: stat.newCases,
        newDeaths: stat.newDeaths,
      })),
    );
  }

  async findLast(countryIso2: string | null, days: number): Promise<DailyStat[]> {
    const models = await DailyStatModel.findAll({
      where: { countryIso2 },
      order: [["date", "DESC"]],
      limit: days,
    });
    return models.reverse().map(
      (model) =>
        new DailyStat({
          countryIso2: model.countryIso2,
          date: model.date,
          cases: Number(model.cases),
          deaths: Number(model.deaths),
          newCases: Number(model.newCases),
          newDeaths: Number(model.newDeaths),
        }),
    );
  }
}
