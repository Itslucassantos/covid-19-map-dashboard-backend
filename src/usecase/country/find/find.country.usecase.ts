import CountryRepositoryInterface from "../../../domain/country/repository/country-repository.interface";
import { InputFindCountryDto, OutputFindCountryDto } from "./find.country.dto";

export default class FindCountryUseCase {
  constructor(private readonly countryRepository: CountryRepositoryInterface) {}

  async execute(input: InputFindCountryDto): Promise<OutputFindCountryDto> {
    const country = await this.countryRepository.find(input.iso2);
    return {
      iso2: country.iso2,
      iso3: country.iso3,
      name: country.name,
      lat: country.lat,
      lng: country.lng,
      population: country.population,
      ...country.stats,
    };
  }
}
