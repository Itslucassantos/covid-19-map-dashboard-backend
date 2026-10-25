import CountryFactory from "../../../domain/country/factory/country.factory";
import ListCountryUseCase from "./list.country.usecase";

describe("Unit test list country use case", () => {
  it("should list countries with the light payload", async () => {
    const ar = CountryFactory.create({
      iso2: "AR",
      iso3: "ARG",
      name: "Argentina",
      lat: -38,
      lng: -63,
      population: null,
    });
    const repository = {
      find: jest.fn(),
      findAll: jest.fn().mockResolvedValue([ar]),
      create: jest.fn(),
      update: jest.fn(),
    };

    const output = await new ListCountryUseCase(repository).execute();

    expect(output.countries).toHaveLength(1);
    expect(output.countries[0]).toEqual({
      iso2: "AR",
      name: "Argentina",
      lat: -38,
      lng: -63,
      cases: 0,
      deaths: 0,
      recovered: null,
      active: null,
      todayCases: 0,
      todayDeaths: 0,
      casesPerMillion: null,
    });
  });
});
