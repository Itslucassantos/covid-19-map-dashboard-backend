import { Sequelize } from "sequelize-typescript";
import CountryFactory from "../../../../domain/country/factory/country.factory";
import CountryModel from "./country.model";
import CountryRepository from "./country.repository";

describe("Country repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });
    sequelize.addModels([CountryModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const brazil = () =>
    CountryFactory.createWithTotals(
      {
        iso2: "BR",
        iso3: "BRA",
        name: "Brazil",
        lat: -14.23,
        lng: -51.92,
        population: 200_000_000,
      },
      { cases: 1000, deaths: 10, todayCases: 5, todayDeaths: 1, updatedAt: new Date("2026-10-17") },
    );

  it("should create and find a country", async () => {
    const repository = new CountryRepository();
    await repository.create(brazil());

    const found = await repository.find("br");

    expect(found.iso2).toBe("BR");
    expect(found.name).toBe("Brazil");
    expect(found.population).toBe(200_000_000);
    expect(found.stats.cases).toBe(1000);
    expect(found.stats.recovered).toBeNull();
    expect(found.stats.casesPerMillion).toBe(5);
    expect(found.stats.updatedAt).toEqual(new Date("2026-10-17"));
  });

  it("should update a country", async () => {
    const repository = new CountryRepository();
    const country = brazil();
    await repository.create(country);
    country.changeStats({ ...country.stats, cases: 2000 });
    await repository.update(country);

    expect((await repository.find("BR")).stats.cases).toBe(2000);
  });

  it("should throw when the country does not exist", async () => {
    const repository = new CountryRepository();
    await expect(repository.find("ZZ")).rejects.toThrow("Country not found");
    await expect(repository.update(brazil())).rejects.toThrow("Country not found");
  });

  it("should find all countries ordered by name", async () => {
    const repository = new CountryRepository();
    await repository.create(brazil());
    await repository.create(
      CountryFactory.create({
        iso2: "AR",
        iso3: "ARG",
        name: "Argentina",
        lat: -38,
        lng: -63,
        population: null,
      }),
    );

    const all = await repository.findAll();

    expect(all.map((c) => c.iso2)).toEqual(["AR", "BR"]);
  });
});
