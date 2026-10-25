import CovidStats from "../../../../domain/country/value-object/covid-stats";
import GlobalStats from "../../../../domain/global/entity/global-stats";
import GlobalStatsRepositoryInterface from "../../../../domain/global/repository/global-stats-repository.interface";
import GlobalStatsModel from "./global-stats.model";

const SINGLE_ROW_ID = 1;

const toNumber = (value: number | string | null): number | null =>
  value === null || value === undefined ? null : Number(value);

export default class GlobalStatsRepository implements GlobalStatsRepositoryInterface {
  async save(stats: GlobalStats): Promise<void> {
    await GlobalStatsModel.upsert({
      id: SINGLE_ROW_ID,
      cases: stats.stats.cases,
      deaths: stats.stats.deaths,
      recovered: stats.stats.recovered,
      active: stats.stats.active,
      todayCases: stats.stats.todayCases,
      todayDeaths: stats.stats.todayDeaths,
      affectedCountries: stats.affectedCountries,
      updatedAt: stats.stats.updatedAt,
    });
  }

  async find(): Promise<GlobalStats | null> {
    const model = await GlobalStatsModel.findByPk(SINGLE_ROW_ID);
    if (!model) {
      return null;
    }
    return new GlobalStats({
      affectedCountries: model.affectedCountries,
      stats: new CovidStats({
        cases: Number(model.cases),
        deaths: Number(model.deaths),
        recovered: toNumber(model.recovered),
        active: toNumber(model.active),
        todayCases: Number(model.todayCases),
        todayDeaths: Number(model.todayDeaths),
        casesPerMillion: null,
        deathsPerMillion: null,
        updatedAt: model.updatedAt,
      }),
    });
  }
}
