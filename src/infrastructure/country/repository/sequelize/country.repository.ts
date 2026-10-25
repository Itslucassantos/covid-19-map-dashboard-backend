import Country from "../../../../domain/country/entity/country";
import CountryNotFoundError from "../../../../domain/country/error/country-not-found.error";
import CountryRepositoryInterface from "../../../../domain/country/repository/country-repository.interface";
import CovidStats from "../../../../domain/country/value-object/covid-stats";
import CountryModel from "./country.model";

const toNumber = (value: number | string | null): number | null =>
  value === null || value === undefined ? null : Number(value);

export default class CountryRepository implements CountryRepositoryInterface {
  async create(entity: Country): Promise<void> {
    await CountryModel.create(CountryRepository.toRow(entity));
  }

  async update(entity: Country): Promise<void> {
    const [affected] = await CountryModel.update(CountryRepository.toRow(entity), {
      where: { iso2: entity.iso2 },
    });
    if (affected === 0) {
      throw new CountryNotFoundError();
    }
  }

  async find(iso2: string): Promise<Country> {
    const model = await CountryModel.findOne({ where: { iso2: iso2.toUpperCase() } });
    if (!model) {
      throw new CountryNotFoundError();
    }
    return CountryRepository.toEntity(model);
  }

  async findAll(): Promise<Country[]> {
    const models = await CountryModel.findAll({ order: [["name", "ASC"]] });
    return models.map(CountryRepository.toEntity);
  }

  private static toRow(entity: Country) {
    return {
      iso2: entity.iso2,
      iso3: entity.iso3,
      name: entity.name,
      lat: entity.lat,
      lng: entity.lng,
      population: entity.population,
      ...entity.stats,
    };
  }

  private static toEntity(model: CountryModel): Country {
    return new Country({
      iso2: model.iso2,
      iso3: model.iso3,
      name: model.name,
      lat: model.lat,
      lng: model.lng,
      population: toNumber(model.population),
      stats: new CovidStats({
        cases: Number(model.cases),
        deaths: Number(model.deaths),
        recovered: toNumber(model.recovered),
        active: toNumber(model.active),
        todayCases: Number(model.todayCases),
        todayDeaths: Number(model.todayDeaths),
        casesPerMillion: model.casesPerMillion,
        deathsPerMillion: model.deathsPerMillion,
        updatedAt: model.updatedAt,
      }),
    });
  }
}
