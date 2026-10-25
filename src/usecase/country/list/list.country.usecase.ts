import Country from "../../../domain/country/entity/country";
import CountryRepositoryInterface from "../../../domain/country/repository/country-repository.interface";
import { OutputListCountryDto } from "./list.country.dto";

class OutputMapper {
  static toOutput(countries: Country[]): OutputListCountryDto {
    return {
      countries: countries.map((country) => ({
        iso2: country.iso2,
        name: country.name,
        lat: country.lat,
        lng: country.lng,
        cases: country.stats.cases,
        deaths: country.stats.deaths,
        recovered: country.stats.recovered,
        active: country.stats.active,
        todayCases: country.stats.todayCases,
        todayDeaths: country.stats.todayDeaths,
        casesPerMillion: country.stats.casesPerMillion,
      })),
    };
  }
}

export default class ListCountryUseCase {
  constructor(private readonly countryRepository: CountryRepositoryInterface) {}

  async execute(): Promise<OutputListCountryDto> {
    return OutputMapper.toOutput(await this.countryRepository.findAll());
  }
}
