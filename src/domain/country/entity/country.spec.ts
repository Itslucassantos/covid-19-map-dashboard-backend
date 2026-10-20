import NotificationError from "../../@shared/notification/notification.error";
import CountryFactory from "../factory/country.factory";
import CovidStats from "../value-object/covid-stats";
import Country from "./country";

const valid = {
  iso2: "BR",
  iso3: "BRA",
  name: "Brazil",
  lat: -14.2,
  lng: -51.9,
  population: 200_000_000,
};

describe("Country unit tests", () => {
  it("creates a country with empty stats by default", () => {
    const country = new Country(valid);
    expect(country.id).toBe("BR");
    expect(country.stats.cases).toBe(0);
    expect(country.stats.recovered).toBeNull();
  });

  it("accumulates every validation error", () => {
    expect.assertions(2);
    try {
      new Country({ ...valid, iso2: "br", name: "", lat: 120 });
    } catch (error) {
      expect(error).toBeInstanceOf(NotificationError);
      const messages = (error as NotificationError).message;
      expect(messages.split(",").length).toBe(3);
    }
  });

  it("rejects negative totals when changing stats", () => {
    const country = new Country(valid);
    const stats = new CovidStats({ ...CovidStats.empty(), cases: -1 });
    expect(() => country.changeStats(stats)).toThrow(NotificationError);
  });

  it("derives per-million figures in the factory", () => {
    const country = CountryFactory.createWithTotals(valid, {
      cases: 20_000_000,
      deaths: 400_000,
      todayCases: 10,
      todayDeaths: -2,
      updatedAt: new Date("2023-03-09T00:00:00Z"),
    });
    expect(country.stats.casesPerMillion).toBe(100_000);
    expect(country.stats.deathsPerMillion).toBe(2_000);
  });

  it("leaves per-million null without population", () => {
    const country = CountryFactory.createWithTotals(
      { ...valid, population: null },
      { cases: 5, deaths: 1, todayCases: 0, todayDeaths: 0, updatedAt: new Date() },
    );
    expect(country.stats.casesPerMillion).toBeNull();
  });
});
