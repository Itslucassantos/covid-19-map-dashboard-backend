import CountryNotFoundError from "../../../domain/country/error/country-not-found.error";
import CountryFactory from "../../../domain/country/factory/country.factory";
import DailyStat from "../../../domain/history/entity/daily-stat";
import FindCountryHistoryUseCase from "./find.country-history.usecase";

const country = CountryFactory.create({
  iso2: "BR",
  iso3: "BRA",
  name: "Brazil",
  lat: 0,
  lng: 0,
  population: null,
});

describe("Unit test find country history use case", () => {
  it("should return the country series", async () => {
    const countryRepository = {
      find: jest.fn().mockResolvedValue(country),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const dailyStatRepository = {
      createMany: jest.fn(),
      findLast: jest.fn().mockResolvedValue([
        new DailyStat({
          countryIso2: "BR",
          date: "2026-01-01",
          cases: 10,
          deaths: 1,
          newCases: 10,
          newDeaths: 1,
        }),
      ]),
    };

    const output = await new FindCountryHistoryUseCase(
      countryRepository,
      dailyStatRepository,
    ).execute({ iso2: "br", days: 30 });

    expect(dailyStatRepository.findLast).toHaveBeenCalledWith("BR", 30);
    expect(output).toEqual({
      iso2: "BR",
      history: [{ date: "2026-01-01", cases: 10, deaths: 1, newCases: 10, newDeaths: 1 }],
    });
  });

  it("should fail for an unknown country", async () => {
    const countryRepository = {
      find: jest.fn().mockRejectedValue(new CountryNotFoundError()),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const dailyStatRepository = { createMany: jest.fn(), findLast: jest.fn() };

    await expect(
      new FindCountryHistoryUseCase(countryRepository, dailyStatRepository).execute({
        iso2: "ZZ",
        days: 30,
      }),
    ).rejects.toThrow("Country not found");
    expect(dailyStatRepository.findLast).not.toHaveBeenCalled();
  });
});
