import CovidDataGateway, {
  CovidSeries,
} from "../../../domain/sync/gateway/covid-data-gateway.interface";
import { SeedData } from "../../../domain/sync/repository/covid-data-seed-repository.interface";
import SeedCovidDataUseCase from "./seed.covid-data.usecase";

const countries = [
  {
    iso2: "CA",
    iso3: "CAN",
    name: "Canada",
    lat: 56,
    lng: -96,
    population: 1_000_000,
    aliases: [],
  },
  {
    iso2: "BR",
    iso3: "BRA",
    name: "Brazil",
    lat: -14,
    lng: -51,
    population: 2_000_000,
    aliases: [],
  },
  { iso2: "AQ", iso3: "ATA", name: "Antarctica", lat: -90, lng: 0, population: null, aliases: [] },
];

const series = (country: string, region: string | null, totals: number[]): CovidSeries => ({
  country,
  region,
  points: totals.map((total, i) => ({
    date: `2023-01-0${i + 1}`,
    total,
    new: total - (totals[i - 1] ?? 0),
  })),
});

function makeGateway(): CovidDataGateway {
  return {
    fetchSeries: async (country, metric) => {
      const factor = metric === "cases" ? 1 : 0.1;
      if (country === "Canada") {
        return [
          series(
            "Canada",
            "Ontario",
            [10, 20].map((n) => n * factor),
          ),
          series(
            "Canada",
            "Quebec",
            [5, 10].map((n) => n * factor),
          ),
        ];
      }
      if (country === "Brazil")
        return [
          series(
            "Brazil",
            null,
            [100, 150].map((n) => n * factor),
          ),
        ];
      return [];
    },
  };
}

describe("SeedCovidDataUseCase unit test", () => {
  it("sums regions, builds the global series and reports empty countries", async () => {
    let saved: SeedData | undefined;
    const useCase = new SeedCovidDataUseCase(
      makeGateway(),
      { save: async (data) => void (saved = data) },
      { countries, pauseMs: 0, sleep: async () => undefined },
    );

    const output = await useCase.execute();

    expect(output.countriesSeeded).toBe(2);
    expect(output.failedCountries).toEqual([{ iso2: "AQ", reason: "no data returned" }]);

    const canada = saved!.countries.find((c) => c.iso2 === "CA")!;
    expect(canada).toMatchObject({ cases: 30, todayCases: 15, deaths: 3 });
    expect(canada.casesPerMillion).toBe(30);

    expect(saved!.global).toMatchObject({ cases: 180, todayCases: 65, affectedCountries: 2 });
    const globalDays = saved!.dailyStats.filter((d) => d.countryIso2 === null);
    expect(globalDays.map((d) => d.cases)).toEqual([115, 180]);
  });
});
