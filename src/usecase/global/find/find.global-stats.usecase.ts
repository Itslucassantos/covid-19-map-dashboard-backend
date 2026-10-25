import CovidStats from "../../../domain/country/value-object/covid-stats";
import GlobalStatsRepositoryInterface from "../../../domain/global/repository/global-stats-repository.interface";
import { OutputFindGlobalStatsDto } from "./find.global-stats.dto";

export default class FindGlobalStatsUseCase {
  constructor(private readonly globalStatsRepository: GlobalStatsRepositoryInterface) {}

  async execute(): Promise<OutputFindGlobalStatsDto> {
    const global = await this.globalStatsRepository.find();
    const stats = global?.stats ?? CovidStats.empty();
    return {
      cases: stats.cases,
      deaths: stats.deaths,
      recovered: stats.recovered,
      active: stats.active,
      todayCases: stats.todayCases,
      todayDeaths: stats.todayDeaths,
      affectedCountries: global?.affectedCountries ?? 0,
      updatedAt: stats.updatedAt,
    };
  }
}
