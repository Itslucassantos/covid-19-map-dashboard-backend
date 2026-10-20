import CountryNotFoundError from "../../../domain/country/error/country-not-found.error";
import CountryFactory from "../../../domain/country/factory/country.factory";
import FindCountryUseCase from "./find.country.usecase";

const country = CountryFactory.createWithTotals(
  { iso2: "BR", iso3: "BRA", name: "Brazil", lat: -14.23, lng: -51.92, population: 200_000_000 },
  { cases: 1000, deaths: 10, todayCases: 5, todayDeaths: 1, updatedAt: new Date("2026-10-17") },
);

describe("Unit test find country use case", () => {
  it("should find a country", async () => {
    const repository = {
      find: jest.fn().mockResolvedValue(country),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const output = await new FindCountryUseCase(repository).execute({ iso2: "BR" });

    expect(output).toEqual({
      iso2: "BR",
      iso3: "BRA",
      name: "Brazil",
      lat: -14.23,
      lng: -51.92,
      population: 200_000_000,
      cases: 1000,
      deaths: 10,
      recovered: null,
      active: null,
      todayCases: 5,
      todayDeaths: 1,
      casesPerMillion: 5,
      deathsPerMillion: expect.closeTo(0.05, 6),
      updatedAt: new Date("2026-10-17"),
    });
  });

  it("should propagate country not found", async () => {
    const repository = {
      find: jest.fn().mockRejectedValue(new CountryNotFoundError()),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    await expect(new FindCountryUseCase(repository).execute({ iso2: "ZZ" })).rejects.toThrow(
      "Country not found",
    );
  });
});
