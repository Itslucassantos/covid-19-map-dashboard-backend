import { Sequelize } from "sequelize-typescript";
import CountryFactory from "../../../domain/country/factory/country.factory";
import CountryModel from "../../../infrastructure/country/repository/sequelize/country.model";
import CountryRepository from "../../../infrastructure/country/repository/sequelize/country.repository";
import FindCountryUseCase from "./find.country.usecase";

describe("Integration test find country use case", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([CountryModel]);
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should find a persisted country", async () => {
    const repository = new CountryRepository();
    await repository.create(
      CountryFactory.create({
        iso2: "BR",
        iso3: "BRA",
        name: "Brazil",
        lat: -14.23,
        lng: -51.92,
        population: 200_000_000,
      }),
    );

    const output = await new FindCountryUseCase(repository).execute({ iso2: "br" });

    expect(output.iso2).toBe("BR");
    expect(output.name).toBe("Brazil");
  });

  it("should throw when the country does not exist", async () => {
    await expect(
      new FindCountryUseCase(new CountryRepository()).execute({ iso2: "ZZ" }),
    ).rejects.toThrow("Country not found");
  });
});
