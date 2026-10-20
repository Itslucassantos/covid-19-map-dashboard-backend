import { CountryReference } from "./country-reference";

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default class CountryNameResolver {
  private readonly byName = new Map<string, CountryReference>();

  constructor(countries: CountryReference[], extraAliases: Record<string, string[]> = {}) {
    for (const country of countries) {
      this.register(country.name, country);
      this.register(country.iso2, country);
      this.register(country.iso3, country);
    }
    for (const country of countries) {
      for (const alias of [...country.aliases, ...(extraAliases[country.iso2] ?? [])]) {
        this.register(alias, country, false);
      }
    }
  }

  resolve(name: string): CountryReference | null {
    return this.byName.get(normalize(name)) ?? null;
  }

  private register(name: string, country: CountryReference, overwrite = true) {
    const key = normalize(name);
    if (key && (overwrite || !this.byName.has(key))) this.byName.set(key, country);
  }
}
