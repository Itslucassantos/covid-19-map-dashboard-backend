import countries from "../../infrastructure/country/dataset/countries.data";
import countryAliases from "../../infrastructure/country/dataset/country-aliases";
import CountryNameResolver from "./country-name-resolver";

describe("CountryNameResolver", () => {
  const resolver = new CountryNameResolver(countries, countryAliases);

  it("resolves dataset names ignoring case and accents", () => {
    expect(resolver.resolve("brazil")?.iso2).toBe("BR");
    expect(resolver.resolve("Côte d'Ivoire")?.iso2).toBe("CI");
  });

  it("resolves upstream aliases", () => {
    expect(resolver.resolve("US")?.iso2).toBe("US");
    expect(resolver.resolve("Korea, South")?.iso2).toBe("KR");
    expect(resolver.resolve("Taiwan*")?.iso2).toBe("TW");
  });

  it("returns null for unknown names", () => {
    expect(resolver.resolve("Atlantis")).toBeNull();
  });

  it("has unique iso2 codes in the dataset", () => {
    expect(new Set(countries.map((c) => c.iso2)).size).toBe(countries.length);
  });
});
