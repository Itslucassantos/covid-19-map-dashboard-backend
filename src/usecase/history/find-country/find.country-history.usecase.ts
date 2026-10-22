import CountryRepositoryInterface from "../../../domain/country/repository/country-repository.interface";
import DailyStatRepositoryInterface from "../../../domain/history/repository/daily-stat-repository.interface";
import { toHistoryPoint } from "../history.mapper";
import {
  InputFindCountryHistoryDto,
  OutputFindCountryHistoryDto,
} from "./find.country-history.dto";

export default class FindCountryHistoryUseCase {
  constructor(
    private readonly countryRepository: CountryRepositoryInterface,
    private readonly dailyStatRepository: DailyStatRepositoryInterface,
  ) {}

  async execute(input: InputFindCountryHistoryDto): Promise<OutputFindCountryHistoryDto> {
    const country = await this.countryRepository.find(input.iso2);
    const stats = await this.dailyStatRepository.findLast(country.iso2, input.days);
    return { iso2: country.iso2, history: stats.map(toHistoryPoint) };
  }
}
