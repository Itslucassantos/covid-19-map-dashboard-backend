import { Sequelize } from "sequelize-typescript";
import CountryFactory from "../../../domain/country/factory/country.factory";
import CountryModel from "../../../infrastructure/country/repository/sequelize/country.model";
import CountryRepository from "../../../infrastructure/country/repository/sequelize/country.repository";
import ListCountryUseCase from "./list.country.usecase";

describe("Integration test list country use case", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
    sequelize.addModels([CountryModel]);
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should list persisted countries", async () => {
    const repository = new CountryRepository();
    for (const [iso2, iso3, name] of [
      ["BR", "BRA", "Brazil"],
      ["AR", "ARG", "Argentina"],
    ]) {
      await repository.create(
        CountryFactory.create({ iso2, iso3, name, lat: 0, lng: 0, population: null }),
      );
    }

    const output = await new ListCountryUseCase(repository).execute();

    expect(output.countries.map((c) => c.iso2)).toEqual(["AR", "BR"]);
  });
});
